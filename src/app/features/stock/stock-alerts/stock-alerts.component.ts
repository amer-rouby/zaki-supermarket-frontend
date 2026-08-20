import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface StockAlert {
  id: number; productId: number; productName: string; batchNumber?: string;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNREAD' | 'READ' | 'RESOLVED'; currentStock?: number;
  minStock?: number; expiryDate?: string; daysUntilExpiry?: number; createdAt: string;
}

interface AlertStats {
  totalAlerts: number; unreadAlerts: number; lowStockAlerts: number;
  expiredAlerts: number; expiringSoonAlerts: number; outOfStockAlerts: number;
}

@Component({
  selector: 'app-stock-alerts', standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './stock-alerts.component.html',
  styleUrl: './stock-alerts.component.scss'
})
export class StockAlertsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly stockAlertService = inject(StockAlertService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly alerts = signal<StockAlert[]>([]);
  readonly stats = signal<AlertStats | null>(null);
  readonly selectedFilter = signal<'all' | 'unread' | 'resolved'>('all');
  readonly selectedType = signal<'all' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED'>('all');

  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(0);

  readonly displayedColumns = ['alertType', 'product', 'message', 'severity', 'status', 'createdAt', 'actions'];
  readonly filterForm: FormGroup = this.fb.group({ alertType: ['all'], status: ['all'] });

  ngOnInit(): void { this.loadAlerts(); this.loadStats(); }

  loadAlerts(): void {
    this.loading.set(true);
    this.stockAlertService.getAlerts().subscribe({
      next: (response: any) => {
        const alertsData = response?.data?.content || response?.content || response || [];
        this.alerts.set(Array.isArray(alertsData) ? alertsData : []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
        this.snackBar.open(this.translate.instant('STOCK_ALERTS.LOAD_ERROR'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 });
        this.alerts.set([]);
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.stockAlertService.getStats().subscribe({
      next: (data) => { this.stats.set(data); },
      error: (error) => { console.error('Error loading stats:', error); }
    });
  }

  onFilterChange(): void {
    this.selectedFilter.set(this.filterForm.get('status')?.value || 'all');
    this.selectedType.set(this.filterForm.get('alertType')?.value || 'all');
    this.pageIndex.set(0);
  }

  onPageChange(event: any): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onMarkAsRead(alertId: number): void {
    this.stockAlertService.markAsRead(alertId).subscribe({
      next: () => {
        this.alerts.update(alerts => alerts.map(a => a.id === alertId ? { ...a, status: 'READ' as const } : a));
        this.loadStats();
        this.snackBar.open(this.translate.instant('STOCK_ALERTS.MARKED_READ'), this.translate.instant('COMMON.CLOSE'), { duration: 2000 });
      },
      error: (error) => { console.error('Error marking as read:', error); }
    });
  }

  onResolve(alertId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.translate.instant('STOCK_ALERTS.CONFIRM_RESOLVE_TITLE') || 'تأكيد الحل',
        message: this.translate.instant('STOCK_ALERTS.CONFIRM_RESOLVE_MSG') || 'هل أنت متأكد من حل هذا التنبيه؟',
        confirmText: this.translate.instant('COMMON.CONFIRM') || 'تأكيد',
        cancelText: this.translate.instant('COMMON.CANCEL') || 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stockAlertService.resolveAlert(alertId).subscribe({
          next: () => {
            this.alerts.update(alerts => alerts.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' as const } : a));
            this.loadStats();
            this.snackBar.open(this.translate.instant('STOCK_ALERTS.RESOLVED'), this.translate.instant('COMMON.CLOSE'), { duration: 2000 });
          },
          error: (error) => { console.error('Error resolving alert:', error); }
        });
      }
    });
  }

  onDelete(alertId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.translate.instant('STOCK_ALERTS.CONFIRM_DELETE_TITLE') || 'تأكيد الحذف',
        message: this.translate.instant('STOCK_ALERTS.CONFIRM_DELETE_MSG') || 'هل أنت متأكد من حذف هذا التنبيه؟',
        confirmText: this.translate.instant('COMMON.DELETE') || 'حذف',
        cancelText: this.translate.instant('COMMON.CANCEL') || 'إلغاء'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stockAlertService.deleteAlert(alertId).subscribe({
          next: () => {
            this.alerts.update(alerts => alerts.filter(a => a.id !== alertId));
            this.loadStats();
            this.snackBar.open(this.translate.instant('STOCK_ALERTS.DELETED'), this.translate.instant('COMMON.CLOSE'), { duration: 2000 });
          },
          error: (error) => { console.error('Error deleting alert:', error); }
        });
      }
    });
  }

  onMarkAllAsRead(): void {
    this.stockAlertService.markAllAsRead().subscribe({
      next: () => {
        this.alerts.update(alerts => alerts.map(a => ({ ...a, status: 'READ' as const })));
        this.loadStats();
        this.snackBar.open(this.translate.instant('STOCK_ALERTS.ALL_MARKED_READ'), this.translate.instant('COMMON.CLOSE'), { duration: 2000 });
      },
      error: (error) => { console.error('Error marking all as read:', error); }
    });
  }

  getAlertTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'LOW_STOCK': 'STOCK_ALERTS.TYPE.LOW_STOCK', 'OUT_OF_STOCK': 'STOCK_ALERTS.TYPE.OUT_OF_STOCK',
      'EXPIRING_SOON': 'STOCK_ALERTS.TYPE.EXPIRING_SOON', 'EXPIRED': 'STOCK_ALERTS.TYPE.EXPIRED'
    };
    return this.translate.instant(labels[type] || type);
  }

  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = { 'LOW': '#10b981', 'MEDIUM': '#f59e0b', 'HIGH': '#ef4444', 'CRITICAL': '#dc2626' };
    return colors[severity] || '#6b7280';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = { 'UNREAD': '#3b82f6', 'READ': '#10b981', 'RESOLVED': '#6b7280' };
    return colors[status] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'UNREAD': 'STOCK_ALERTS.STATUS.UNREAD', 'READ': 'STOCK_ALERTS.STATUS.READ', 'RESOLVED': 'STOCK_ALERTS.STATUS.RESOLVED' };
    return this.translate.instant(labels[status] || status);
  }

  formatDate(dateString: string): string { return new Date(dateString).toLocaleString('ar-EG'); }

  getFilteredAlertsCount(): number {
    return this.allFilteredData().length;
  }

  private allFilteredData(): StockAlert[] {
    const alertsArray = this.alerts();
    if (!Array.isArray(alertsArray)) return [];
    let filtered = [...alertsArray];
    if (this.selectedFilter() !== 'all') {
      filtered = filtered.filter(a => a.status.toLowerCase() === this.selectedFilter());
    }
    if (this.selectedType() !== 'all') {
      filtered = filtered.filter(a => a.alertType === this.selectedType());
    }
    return filtered;
  }

  getFilteredAlerts(): StockAlert[] {
    const filtered = this.allFilteredData();
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  }
}
