import { Component, inject, signal, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, RouterLink, MatTableModule, MatPaginatorModule],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.scss'
})
export class PurchaseOrdersComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly purchaseService = inject(PurchaseOrderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly currencyService = inject(CurrencyService);

  readonly loading = signal(false);
  readonly stats = signal<any>(null);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  displayedColumns: string[] = ['orderNumber', 'supplier', 'orderDate', 'totalAmount', 'status', 'priority', 'actions'];
  dataSource = new MatTableDataSource<PurchaseOrder>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadOrders(0, 10);
    }, 0);
  }

  ngOnDestroy(): void {
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadOrders(event.pageIndex, event.pageSize);
  }

  loadOrders(pageIndex: number = 0, pageSize: number = 10): void {
    this.loading.set(true);
    this.purchaseService.getOrders(pageIndex, pageSize).subscribe({
      next: (response: any) => {
        const content = response?.data?.content || response?.content || [];
        const total = response?.data?.totalElements || response?.totalElements || content.length;
        this.dataSource.data = content;
        this.totalElements.set(total);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'PURCHASES.LOAD_ERROR');
      }
    });
  }

  loadStats(): void {
    this.purchaseService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.LOAD_ERROR')
    });
  }

  onView(order: PurchaseOrder): void {
    this.router.navigate(['/purchases', order.id]);
  }

  onEdit(order: PurchaseOrder): void {
    if (order.status === 'DRAFT') {
      this.router.navigate(['/purchases', order.id, 'edit']);
    } else {
      this.errorHandler.showWarning('PURCHASES.EDIT_DRAFT_ONLY');
    }
  }

  onDelete(order: PurchaseOrder): void {
    if (order.status !== 'DRAFT') {
      this.errorHandler.showWarning('PURCHASES.DELETE_DRAFT_ONLY');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: this.translate.instant('PURCHASES.CONFIRM_DELETE'),
        message: this.translate.instant('PURCHASES.CONFIRM_DELETE_MSG', { order: order.orderNumber }),
        confirmText: this.translate.instant('COMMON.DELETE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.purchaseService.deleteOrder(order.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PURCHASES.DELETED');
            this.loadOrders(this.pageIndex(), this.pageSize());
            this.loadStats();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.DELETE_ERROR')
        });
      }
    });
  }

  onApprove(order: PurchaseOrder): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: this.translate.instant('PURCHASES.CONFIRM_APPROVE'),
        message: this.translate.instant('PURCHASES.CONFIRM_APPROVE_MSG', { order: order.orderNumber }),
        confirmText: this.translate.instant('PURCHASES.APPROVE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.purchaseService.approveOrder(order.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PURCHASES.APPROVED');
            this.loadOrders(this.pageIndex(), this.pageSize());
            this.loadStats();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.APPROVE_ERROR')
        });
      }
    });
  }

  onReceive(order: PurchaseOrder): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('PURCHASES.CONFIRM_RECEIVE'),
        message: this.translate.instant('PURCHASES.CONFIRM_RECEIVE_MSG', { order: order.orderNumber }),
        confirmText: this.translate.instant('PURCHASES.RECEIVE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'accent'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.purchaseService.receiveOrder(order.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('PURCHASES.RECEIVED');
            this.loadOrders(this.pageIndex(), this.pageSize());
            this.loadStats();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'PURCHASES.RECEIVE_ERROR')
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'DRAFT': 'PURCHASES.STATUS.DRAFT',
      'PENDING': 'PURCHASES.STATUS.PENDING',
      'APPROVED': 'PURCHASES.STATUS.APPROVED',
      'RECEIVED': 'PURCHASES.STATUS.RECEIVED',
      'CANCELLED': 'PURCHASES.STATUS.CANCELLED'
    };
    return this.translate.instant(labels[status] || status);
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

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'LOW': '#10b981',
      'NORMAL': '#3b82f6',
      'URGENT': '#ef4444'
    };
    return colors[priority] || '#6b7280';
  }

  formatDate(date: string): string {
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
