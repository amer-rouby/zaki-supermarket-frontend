import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
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

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: this.translate.instant('PURCHASES.CONFIRM_DELETE'),
        message: this.translate.instant('PURCHASES.CONFIRM_DELETE_MSG', { order: this.order()!.orderNumber }),
        confirmText: this.translate.instant('COMMON.DELETE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: this.translate.instant('PURCHASES.CONFIRM_APPROVE'),
        message: this.translate.instant('PURCHASES.CONFIRM_APPROVE_MSG', { order: this.order()!.orderNumber }),
        confirmText: this.translate.instant('PURCHASES.APPROVE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
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

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('PURCHASES.SEND_EMAIL'),
        message: this.translate.instant('PURCHASES.SEND_EMAIL_CONFIRM', { supplier: order.supplierName }),
        confirmText: this.translate.instant('PURCHASES.SEND_EMAIL'),
        cancelText: this.translate.instant('COMMON.CANCEL')
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.emailSending.set(true);
      this.purchaseService.sendEmail(order.id).subscribe({
        next: (response) => {
          this.emailSending.set(false);
          this.snackBar.open(
            this.translate.instant('PURCHASES.SEND_EMAIL_SUCCESS', { email: response.recipientEmail }),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 4000, panelClass: ['success-snackbar'] }
          );
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('PURCHASES.CONFIRM_RECEIVE'),
        message: this.translate.instant('PURCHASES.CONFIRM_RECEIVE_MSG', { order: this.order()!.orderNumber }),
        confirmText: this.translate.instant('PURCHASES.RECEIVE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'accent'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
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
