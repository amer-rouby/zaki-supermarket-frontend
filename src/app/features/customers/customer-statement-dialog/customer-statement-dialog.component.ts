import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerStatement, CustomerTransaction } from '../../../core/models/customer.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-customer-statement-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule],
  templateUrl: './customer-statement-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './customer-statement-dialog.component.scss'
})
export class CustomerStatementDialogComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  dialogRef = inject(MatDialogRef<CustomerStatementDialogComponent>);
  data = inject<{ customerId: number }>(MAT_DIALOG_DATA);

  readonly statement = signal<CustomerStatement | null>(null);
  readonly loading = signal(false);
  readonly submittingPayment = signal(false);
  readonly showPaymentForm = signal(false);
  paymentAmount: number | null = null;

  ngOnInit(): void {
    this.loadStatement();
  }

  loadStatement(): void {
    this.loading.set(true);
    this.customerService.getStatement(this.data.customerId).subscribe({
      next: (data) => {
        this.statement.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onTogglePaymentForm(): void {
    this.showPaymentForm.update(v => !v);
    this.paymentAmount = null;
  }

  onSubmitPayment(): void {
    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.submittingPayment.set(true);
    this.customerService.recordPayment(this.data.customerId, { amount: this.paymentAmount }).subscribe({
      next: () => {
        this.submittingPayment.set(false);
        this.showPaymentForm.set(false);
        this.paymentAmount = null;
        this.errorHandler.showSuccess('CUSTOMERS.PAYMENT_RECORDED');
        this.loadStatement();
      },
      error: (err) => {
        this.submittingPayment.set(false);
        this.errorHandler.handleHttpError(err, 'CUSTOMERS.PAYMENT_ERROR');
      }
    });
  }

  getTransactionIcon(type: string): string {
    return type === 'CREDIT_SALE' ? 'shopping_cart' : 'payments';
  }

  getTransactionColor(type: string): string {
    return type === 'CREDIT_SALE' ? '#ef4444' : '#10b981';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
