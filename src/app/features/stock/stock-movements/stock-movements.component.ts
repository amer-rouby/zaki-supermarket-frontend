import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { StockMovementService } from '../../../core/services/stock-movement.service';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './stock-movements.component.html',
  styleUrl: './stock-movements.component.scss'
})
export class StockMovementsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly stockMovementService = inject(StockMovementService);

  readonly loading = signal(false);
  readonly movements = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalElements = signal(0);
  readonly isFiltered = signal(false);

  readonly filterForm: FormGroup = this.fb.group({
    startDate: [''],
    endDate: [''],
    movementType: ['all']
  });

  readonly displayedColumns = [
    'movementType',
    'product',
    'quantity',
    'quantityChange',
    'reference',
    'movementDate',
    'userName'
  ];

  ngOnInit(): void {
    this.loadMovements();
    this.loadStats();
  }

  loadMovements(): void {
    this.isFiltered.set(false);
    this.loading.set(true);

    this.stockMovementService.getMovements(this.page(), this.size()).subscribe({
      next: (pageResult) => {
        this.movements.set(pageResult.content);
        this.totalElements.set(pageResult.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading movements:', error);
        this.snackBar.open(
          this.translate.instant('STOCK_MOVEMENTS.LOAD_ERROR'),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 3000 }
        );
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    if (this.isFiltered()) {
      this.applyDateFilter();
    } else {
      this.loadMovements();
    }
  }

  loadStats(): void {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = this.formatDateForAPI(startDate);
    const endDateStr = this.formatDateForAPI(today);

    this.stockMovementService.getStats(startDateStr, endDateStr).subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Backend's /date-range endpoint expects a full ISO date-time, not just a date. */
  private formatDateTimeForAPI(date: Date, endOfDay: boolean): string {
    const datePart = this.formatDateForAPI(date);
    return endOfDay ? `${datePart}T23:59:59` : `${datePart}T00:00:00`;
  }

  onFilter(): void {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (startDate && endDate) {
      this.isFiltered.set(true);
      this.page.set(0);
      this.applyDateFilter();
    } else {
      this.loadMovements();
    }
  }

  private applyDateFilter(): void {
    const startDate: Date = this.filterForm.get('startDate')?.value;
    const endDate: Date = this.filterForm.get('endDate')?.value;
    const movementType = this.filterForm.get('movementType')?.value;

    const startIso = this.formatDateTimeForAPI(startDate, false);
    const endIso = this.formatDateTimeForAPI(endDate, true);

    this.loading.set(true);
    this.stockMovementService
      .getMovementsByDateRange(startIso, endIso, movementType, this.page(), this.size())
      .subscribe({
        next: (pageResult) => {
          this.movements.set(pageResult.content);
          this.totalElements.set(pageResult.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error filtering movements:', error);
          this.snackBar.open(
            this.translate.instant('STOCK_MOVEMENTS.LOAD_ERROR'),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 3000 }
          );
          this.loading.set(false);
        }
      });
  }

  getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'STOCK_IN': 'STOCK_MOVEMENTS.TYPE.STOCK_IN',
      'STOCK_OUT': 'STOCK_MOVEMENTS.TYPE.STOCK_OUT',
      'STOCK_ADJUSTMENT': 'STOCK_MOVEMENTS.TYPE.STOCK_ADJUSTMENT',
      'TRANSFER_IN': 'STOCK_MOVEMENTS.TYPE.TRANSFER_IN',
      'TRANSFER_OUT': 'STOCK_MOVEMENTS.TYPE.TRANSFER_OUT',
      'EXPIRED': 'STOCK_MOVEMENTS.TYPE.EXPIRED',
      'DISCARDED': 'STOCK_MOVEMENTS.TYPE.DISCARDED'
    };
    return this.translate.instant(labels[type] || type);
  }

  getMovementTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'STOCK_IN': 'add_shopping_cart',
      'STOCK_OUT': 'remove_shopping_cart',
      'STOCK_ADJUSTMENT': 'tune',
      'TRANSFER_IN': 'input',
      'TRANSFER_OUT': 'output',
      'EXPIRED': 'warning',
      'DISCARDED': 'delete'
    };
    return icons[type] || 'inventory';
  }

  getMovementTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'STOCK_IN': '#10b981',
      'STOCK_OUT': '#ef4444',
      'STOCK_ADJUSTMENT': '#f59e0b',
      'TRANSFER_IN': '#3b82f6',
      'TRANSFER_OUT': '#8b5cf6',
      'EXPIRED': '#dc2626',
      'DISCARDED': '#6b7280'
    };
    return colors[type] || '#6b7280';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ar-EG');
  }

  formatQuantityChange(before: number, after: number): string {
    const diff = after - before;
    return diff > 0 ? `+${diff}` : `${diff}`;
  }
}
