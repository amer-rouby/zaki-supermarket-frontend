import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { StockBatchService } from '../../../core/services/stock.service';
import { StockAdjustmentHistory } from '../../../core/models/stock.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-stock-adjustment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './stock-adjustment-history.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stock-adjustment-history.component.scss'
})
export class StockAdjustmentHistoryComponent implements OnInit {
  private readonly stockService = inject(StockBatchService);
  private readonly authService = inject(AuthService);
  dialogRef = inject(MatDialogRef<StockAdjustmentHistoryComponent>);
  data = inject(MAT_DIALOG_DATA);

  readonly history = signal<StockAdjustmentHistory[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    const storeId = this.data.batch.storeId || this.authService.getStoreId();

    this.stockService.getAdjustmentHistory(this.data.batch.id, storeId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.history.set(response.data);
        } else {
          this.history.set([]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load adjustment history:', err);
        this.loading.set(false);
        this.history.set([]);
      }
    });
  }

  getAdjustmentIcon(type: string): string {
    switch (type) {
      case 'ADD': return 'add_circle';
      case 'REMOVE': return 'remove_circle';
      case 'CORRECTION': return 'edit';
      default: return 'history';
    }
  }

  getAdjustmentLabel(type: string): string {
    const labels: Record<string, string> = {
      'ADD': '➕ إضافة',
      'REMOVE': '➖ إزالة',
      'CORRECTION': '✏️ تصحيح'
    };
    return labels[type] || type;
  }

  getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      'DAMAGED': 'تالف',
      'EXPIRED': 'منتهي الصلاحية',
      'RETURNED': 'مرتجع',
      'COUNT_ERROR': 'خطأ في الجرد',
      'OTHER': 'أخرى'
    };
    return labels[reason] || reason;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
