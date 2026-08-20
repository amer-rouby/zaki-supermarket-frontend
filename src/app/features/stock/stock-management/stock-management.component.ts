import { Component, inject, signal, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { LanguageService } from '../../../core/services/language.service';
import { StockBatchService } from '../../../core/services/stock.service';
import { StockBatch } from '../../../core/models/stock.model';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { StockAdjustmentDialogComponent } from '../stock-adjustment-dialog/stock-adjustment-dialog.component';
import { StockAdjustmentHistoryComponent } from '../stock-adjustment-history/stock-adjustment-history.component';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { TableLoadingComponent } from '../../../shared/components/table-loading/table-loading.component';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MaterialModule,
    PageHeaderComponent,
    TableLoadingComponent,
  ],
  templateUrl: './stock-management.component.html',
  styleUrl: './stock-management.component.scss'
})
export class StockManagementComponent implements OnInit, AfterViewInit {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly stockBatchService = inject(StockBatchService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly storeContext = inject(StoreContextService);
  private readonly errorHandler = inject(ErrorHandlerService);

  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<StockBatch>([]);
  displayedColumns: string[] = ['product', 'batch', 'quantity', 'expiry', 'status', 'actions'];

  readonly loading = signal(false);
  readonly searchQuery = signal('');
  get storeId(): number {
    return this.storeContext.getStoreId();
  }
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadStockBatches();

    // Reload data when language changes
    this.languageService.currentLang$.subscribe(() => {
      this.loadStockBatches();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadStockBatches(): void {
    this.loading.set(true);

    this.stockBatchService.getBatches(this.storeId, this.currentPage(), this.pageSize()).subscribe({
      next: (response: any) => {
        const batches = this.extractBatches(response);
        const total = this.extractTotal(response);

        this.dataSource.data = batches;
        this.totalElements.set(total);
        this.loading.set(false);
      },
      error: () => {
        this.errorHandler.showError('STOCK.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  private extractBatches(response: any): StockBatch[] {
    if (response?.content && Array.isArray(response.content)) return response.content;
    if (response?.data?.content && Array.isArray(response.data.content)) return response.data.content;
    if (response?.data && Array.isArray(response.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  }

  private extractTotal(response: any): number {
    if (response?.totalElements) return response.totalElements;
    if (response?.data?.totalElements) return response.data.totalElements;
    return this.dataSource.data.length;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadStockBatches();
  }

  getStatusLabel(status: string): string {
    const statusKey = status?.toUpperCase() || 'GOOD';
    const translated = this.translate.instant(`STOCK.STATUS.${statusKey}`);
    return translated !== `STOCK.STATUS.${statusKey}` ? translated : status;
  }

  getStatusChipColor(status: string): 'primary' | 'accent' | 'warn' | '' {
    switch (status) {
      case 'ACTIVE':
      case 'GOOD': return 'primary';
      case 'LOW':
      case 'EXPIRING_SOON': return 'accent';
      case 'EXPIRED':
      case 'DISCARDED': return 'warn';
      default: return '';
    }
  }

  getQuantityChipColor(quantity: number): 'primary' | 'accent' | 'warn' | '' {
    if (quantity <= 10) return 'warn';
    if (quantity <= 20) return 'accent';
    return 'primary';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(this.languageService.getCurrentLanguage() === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onEdit(batch: StockBatch): void {
    this.router.navigate(['/stock', 'batches', batch.id, 'edit'], {
      queryParams: { storeId: this.storeId }
    });
  }

  onAdjust(batch: StockBatch): void {
    const dialogRef = this.dialog.open(StockAdjustmentDialogComponent, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 48px)',
      autoFocus: false,
      panelClass: 'stock-adjustment-dialog-panel',
      data: { batch, storeId: this.storeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStockBatches();
      }
    });
  }

  onDelete(batch: StockBatch): void {
    this.confirmDialog.open({
      messageKey: 'STOCK.DELETE_CONFIRM',
      messageParams: { name: batch.batchNumber },
      width: '400px',
      color: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.stockBatchService.deleteBatch(batch.id, this.storeId).subscribe({
          next: () => {
            this.errorHandler.showSuccess('STOCK.DELETE_SUCCESS');
            this.loadStockBatches();
          },
          error: () => {
            this.errorHandler.showError('STOCK.DELETE_ERROR');
          }
        });
      }
    });
  }

  onViewHistory(batch: StockBatch): void {
    this.dialog.open(StockAdjustmentHistoryComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { batch: { ...batch, storeId: this.storeId } }
    });
  }

  applyFilter(): void {
    const query = this.searchQuery().trim().toLowerCase();
    this.dataSource.filter = query;
  }

  onSearch(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.applyFilter();
  }

}
