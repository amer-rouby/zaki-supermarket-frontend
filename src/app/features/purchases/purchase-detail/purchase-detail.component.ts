import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { WhatsAppDialogComponent } from '../../../shared/components/whatsapp-dialog/whatsapp-dialog.component';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CommonModule } from '@angular/common';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, RouterLink, CommonModule],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.scss'
})
export class PurchaseDetailComponent implements OnInit {
  private readonly purchaseService = inject(PurchaseOrderService);
  private readonly dialog = inject(MatDialog);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly currencyService = inject(CurrencyService);

  readonly loading = signal(false);
  readonly order = signal<PurchaseOrder | null>(null);
  readonly emailSending = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadOrder(+id);
  }

  loadOrder(id: number): void {
    this.loading.set(true);
    this.purchaseService.getOrder(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'PURCHASES.LOAD_ERROR');
        this.router.navigate(['/purchases']);
      }
    });
  }

  onEdit(): void {
    if (this.order()?.status === 'DRAFT') {
      this.router.navigate(['/purchases', this.order()?.id, 'edit']);
    } else {
      this.errorHandler.showWarning('PURCHASES.EDIT_DRAFT_ONLY');
    }
  }

  onDelete(): void {
    if (this.order()?.status !== 'DRAFT') {
      this.errorHandler.showWarning('PURCHASES.DELETE_DRAFT_ONLY');
      return;
    }

    this.confirmDialog.open({
      titleKey: 'PURCHASES.CONFIRM_DELETE',
      messageKey: 'PURCHASES.CONFIRM_DELETE_MSG',
      messageParams: { order: this.order()!.orderNumber },
      confirmKey: 'COMMON.DELETE',
      width: '500px',
      color: 'warn'
    }).subscribe(result => {
      if (result) {
        this.purchaseService.deleteOrder(this.order()!.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PURCHASES.DELETED');
            this.router.navigate(['/purchases']);
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.DELETE_ERROR')
        });
      }
    });
  }

  onApprove(): void {
    this.confirmDialog.open({
      titleKey: 'PURCHASES.CONFIRM_APPROVE',
      messageKey: 'PURCHASES.CONFIRM_APPROVE_MSG',
      messageParams: { order: this.order()!.orderNumber },
      confirmKey: 'PURCHASES.APPROVE',
      width: '500px',
      color: 'primary'
    }).subscribe(result => {
      if (result) {
        this.purchaseService.approveOrder(this.order()!.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PURCHASES.APPROVED');
            this.loadOrder(this.order()!.id);
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.APPROVE_ERROR')
        });
      }
    });
  }

  /**
   * Opens the WhatsApp dialog to preview and send the order to the supplier.
   */
  onSendWhatsApp(): void {
    const order = this.order();
    if (!order) return;

    this.dialog.open(WhatsAppDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'whatsapp-dialog-panel',
      disableClose: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        supplierName: order.supplierName
      }
    });
  }

  /**
   * Confirms, then sends the purchase order to the supplier's email directly
   * (unlike WhatsApp's click-to-chat link, this is a real server-side send).
   */
  onSendEmail(): void {
    const order = this.order();
    if (!order) return;

    this.confirmDialog.open({
      titleKey: 'PURCHASES.SEND_EMAIL',
      messageKey: 'PURCHASES.SEND_EMAIL_CONFIRM',
      messageParams: { supplier: order.supplierName },
      confirmKey: 'PURCHASES.SEND_EMAIL',
      width: '400px',
      color: 'primary'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.emailSending.set(true);
      this.purchaseService.sendEmail(order.id).subscribe({
        next: (response) => {
          this.emailSending.set(false);
          this.errorHandler.showSuccess('PURCHASES.SEND_EMAIL_SUCCESS', {
            duration: 4000,
            params: { email: response.recipientEmail }
          });
        },
        error: (err) => {
          this.emailSending.set(false);
          // The backend's message ("Supplier has no email on file", SMTP not
          // configured, etc.) is actionable and specific - worth showing directly
          // instead of a generic "failed to send" the user can't act on.
          const backendMessage = err?.error?.message;
          if (backendMessage) {
            this.errorHandler.show(backendMessage, { panelClass: ['error-snackbar'] });
          } else {
            this.errorHandler.handleHttpError(err, 'PURCHASES.SEND_EMAIL_ERROR');
          }
        }
      });
    });
  }

  onReceive(): void {
    this.confirmDialog.open({
      titleKey: 'PURCHASES.CONFIRM_RECEIVE',
      messageKey: 'PURCHASES.CONFIRM_RECEIVE_MSG',
      messageParams: { order: this.order()!.orderNumber },
      confirmKey: 'PURCHASES.RECEIVE',
      width: '400px',
      color: 'accent'
    }).subscribe(result => {
      if (result) {
        this.purchaseService.receiveOrder(this.order()!.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PURCHASES.RECEIVED');
            this.loadOrder(this.order()!.id);
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.RECEIVE_ERROR')
        });
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'DRAFT': '#6b7280',
      'PENDING': '#f59e0b',
      'APPROVED': '#3b82f6',
      'RECEIVED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatAmount(amount: number): string {
    return this.currencyService.format(amount, 'ar');
  }
}
