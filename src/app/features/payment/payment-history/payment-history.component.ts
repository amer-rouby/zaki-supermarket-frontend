import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyService } from '../../../core/services/currency.service';
import { MatDialog } from '@angular/material/dialog';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Payment } from '../../../core/models/payment.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { RefundFormComponent } from '../refund-form/refund-form.component';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    TranslateModule,
    PageHeaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.scss'
})
export class PaymentHistoryComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly currencyService = inject(CurrencyService);

  readonly loading = signal(false);
  readonly payments = signal<Payment[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly filterForm: FormGroup;
  displayedColumns = ['referenceNumber', 'amount', 'paymentMethod', 'status', 'actions'];

  constructor() {
    this.filterForm = this.fb.group({
      status: [''],
      paymentMethod: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadPayments();

    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex.set(0);
      this.loadPayments();
    });

    this.filterForm.get('status')?.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadPayments();
    });

    this.filterForm.get('paymentMethod')?.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadPayments();
    });
  }

  loadPayments(): void {
    this.loading.set(true);
    const storeId = this.authService.getStoreId() || 1;

    const status = this.filterForm.get('status')?.value;
    const paymentMethod = this.filterForm.get('paymentMethod')?.value;
    const search = this.filterForm.get('search')?.value;

    this.paymentService.getPayments(
      storeId,
      this.pageIndex(),
      this.pageSize(),
      status && status !== 'all' ? status : undefined,
      paymentMethod && paymentMethod !== 'all' ? paymentMethod : undefined,
      search || undefined
    ).subscribe({
      next: (response) => {
        this.payments.set(response.content || []);
        this.totalItems.set(response.totalElements || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.payments.set([]);
        this.loading.set(false);
        this.errorHandler.showError('PAYMENTS.LOAD_ERROR', { duration: 4000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPayments();
  }

  async onRefund(payment: Payment): Promise<void> {
    if (!payment.referenceNumber) return;

    this.confirmDialog.open({
      titleKey: 'PAYMENTS.CONFIRM_REFUND_TITLE',
      messageKey: 'PAYMENTS.CONFIRM_REFUND_TEXT',
      messageParams: { amount: payment.amount },
      confirmKey: 'COMMON.CONFIRM',
      width: '400px',
      color: 'primary'
    }).subscribe(async (result) => {
      if (result) {
        const refundDialogRef = this.dialog.open(RefundFormComponent, {
          width: '500px',
          data: {
            paymentReference: payment.referenceNumber,
            maxAmount: payment.amount
          }
        });

        refundDialogRef.afterClosed().subscribe((success) => {
          if (success) {
            this.errorHandler.showSuccess('PAYMENTS.REFUND_SUCCESS');
            this.loadPayments();
          }
        });
      }
    });
  }

  async onCancel(payment: Payment): Promise<void> {
    if (!payment.referenceNumber) return;

    this.confirmDialog.open({
      titleKey: 'PAYMENTS.CONFIRM_CANCEL_TITLE',
      messageKey: 'PAYMENTS.CONFIRM_CANCEL_TEXT',
      confirmKey: 'COMMON.CONFIRM',
      width: '400px',
      color: 'warn'
    }).subscribe((result) => {
      if (result) {
        this.paymentService.cancelPayment(payment.referenceNumber).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PAYMENTS.CANCEL_SUCCESS');
            this.loadPayments();
          },
          error: () => this.errorHandler.showError('PAYMENTS.CANCEL_ERROR', { duration: 4000 })
        });
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      COMPLETED: '#10b981',
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      FAILED: '#ef4444',
      CANCELLED: '#6b7280',
      REFUNDED: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'PAYMENTS.CASH',
      VISA: 'PAYMENTS.VISA',
      MASTERCARD: 'PAYMENTS.MASTERCARD',
      INSTAPAY: 'PAYMENTS.INSTAPAY',
      FAWRY: 'PAYMENTS.FAWRY',
      WALLET: 'PAYMENTS.WALLET',
      BANK_TRANSFER: 'PAYMENTS.BANK_TRANSFER'
    };
    return this.translate.instant(labels[method] || method);
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      CASH: 'payments',
      VISA: 'credit_card',
      MASTERCARD: 'credit_card',
      INSTAPAY: 'account_balance',
      FAWRY: 'store',
      WALLET: 'account_balance_wallet',
      BANK_TRANSFER: 'transfer_within_a_station'
    };
    return icons[method] || 'payment';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      COMPLETED: 'PAYMENTS.COMPLETED',
      PENDING: 'PAYMENTS.PENDING',
      PROCESSING: 'PAYMENTS.PROCESSING',
      FAILED: 'PAYMENTS.FAILED',
      CANCELLED: 'PAYMENTS.CANCELLED',
      REFUNDED: 'PAYMENTS.REFUNDED'
    };
    return this.translate.instant(labels[status] || status);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ar-EG');
  }

  formatAmount(amount: number): string {
    return this.currencyService.format(amount, 'ar');
  }

  canRefund(payment: Payment): boolean {
    return payment.status === 'COMPLETED';
  }

  canCancel(payment: Payment): boolean {
    return payment.status === 'PENDING' || payment.status === 'PROCESSING';
  }

  viewReceipt(referenceNumber: string): void {
    this.router.navigate(['/payments/receipt', referenceNumber]);
  }

  resetFilters(): void {
    this.filterForm.reset({
      status: '',
      paymentMethod: '',
      search: ''
    });
    this.pageIndex.set(0);
    this.loadPayments();
  }
}
