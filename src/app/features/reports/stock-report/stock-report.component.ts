import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartDataset } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ExportService } from '../../../core/services/export.service';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { PrintHelperService } from '../../../core/services/print-helper.service';
import { ExpiringRow, LowStockRow, ReportRequest, StockCategoryRow, StockReportData } from '../../../core/models/Report.model';

@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MaterialModule,
    PageHeaderComponent,
    BaseChartDirective
  ],
  templateUrl: './stock-report.component.html',
  styleUrl: './stock-report.component.scss'
})
export class StockReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly exportService = inject(ExportService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly printHelper = inject(PrintHelperService);

  readonly reportType = signal<'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'>('CUSTOM');
  readonly stockReportData = signal<StockReportData | null>(null);
  readonly reportLoading = signal(false);
  readonly reportError = signal<string>('');
  readonly exportLoading = signal(false);
  readonly categoryTableData = signal<StockCategoryRow[]>([]);
  readonly lowStockTableData = signal<LowStockRow[]>([]);
  readonly expiringTableData = signal<ExpiringRow[]>([]);
  readonly activeTable = signal<'categories' | 'low-stock' | 'expiring'>('categories');

  readonly barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: '',
        backgroundColor: '#667eea',
        borderColor: '#556cd6',
        borderWidth: 1
      }
    ] as ChartDataset<'bar'>[]
  };

  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } }
  };

  readonly doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'] }] as ChartDataset<'doughnut'>[]
  };

  readonly doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } }
  };

  constructor() {
    effect(() => {
      const _ = this.languageService.getCurrentLanguage();
      const data = this.stockReportData();
      if (data) {
        this.updateCharts(data);
      }
    });
  }

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.reportLoading.set(true);
    this.reportError.set('');

    const request: ReportRequest = {
      storeId: this.getStoreId(),
      reportType: this.reportType()
    };

    this.reportService.getStockReport(request).subscribe({
      next: (data: StockReportData) => {
        this.stockReportData.set(data);
        this.updateTables(data);
        this.updateCharts(data);
        this.reportLoading.set(false);
      },
      error: (error) => {
        this.reportError.set('REPORTS.LOAD_ERROR');
        this.reportLoading.set(false);
        this.errorHandler.handleHttpError(error, 'REPORTS.LOAD_ERROR');
      }
    });
  }

  private updateTables(data: StockReportData): void {
    if (data.stockByCategory?.length) {
      this.categoryTableData.set(data.stockByCategory.map((cat: any) => ({
        categoryName: cat.categoryName,
        itemCount: cat.itemCount,
        totalValue: cat.totalValue
      })));
    } else {
      this.categoryTableData.set([]);
    }
    if (data.lowStockProducts?.length) {
      this.lowStockTableData.set(data.lowStockProducts.map((item: any) => ({
        ...item,
        progress: Math.min(100, (item.currentStock / (item.minStock || 1)) * 100)
      })));
    } else {
      this.lowStockTableData.set([]);
    }

    if (data.expiringProducts?.length) {
      this.expiringTableData.set(data.expiringProducts.map((item: any) => {
        let status: 'urgent' | 'warning' | 'ok' = 'ok';
        if (item.daysUntilExpiry <= 7) status = 'urgent';
        else if (item.daysUntilExpiry <= 30) status = 'warning';
        return { ...item, status };
      }));
    } else {
      this.expiringTableData.set([]);
    }
  }

  private updateCharts(data: StockReportData): void {
    // Bar chart - value by category
    this.barChartData.datasets[0].label = this.translate.instant('STOCK.TOTAL_VALUE');
    if (data.stockByCategory?.length) {
      this.barChartData.labels = data.stockByCategory.map((c: any) => c.categoryName);
      this.barChartData.datasets[0].data = data.stockByCategory.map((c: any) => c.totalValue);
    }

    // Doughnut chart - stock status distribution
    const totalItems = data.totalItems || 0;
    const lowStockItems = data.lowStockItems || 0;
    const expiredItems = data.expiredItems || 0;
    const expiringSoonItems = data.expiringSoonItems || 0;

    const statusData = [
      totalItems - lowStockItems - expiredItems,
      lowStockItems,
      expiredItems,
      expiringSoonItems
    ];

    this.doughnutChartData.labels = [
      this.translate.instant('STOCK.STATUS.GOOD'),
      this.translate.instant('STOCK.STATUS.LOW'),
      this.translate.instant('STOCK.STATUS.EXPIRED'),
      this.translate.instant('STOCK.STATUS.EXPIRING_SOON')
    ];
    this.doughnutChartData.datasets[0].data = statusData;
  }

  setActiveTable(tab: 'categories' | 'low-stock' | 'expiring'): void {
    this.activeTable.set(tab);
  }

  exportPDF(): void {
    this.exportLoading.set(true);
    const data = this.stockReportData();
    if (!data) {
      this.exportLoading.set(false);
      this.errorHandler.showError('REPORTS.NO_DATA');
      return;
    }

    try {
      const isArabic = this.languageService.getCurrentLanguage() === 'ar';
      const t = (key: string): string => {
        const val = this.translate.instant(key);
        return val && val !== key ? val : key;
      };

      if (this.activeTable() === 'categories' && data.stockByCategory?.length) {
        const categoryRows = data.stockByCategory.map(cat => ({
          categoryName: cat.categoryName || t('PRODUCTS.UNNAMED'),
          itemCount: cat.itemCount || 0,
          totalValue: cat.totalValue || 0
        }));

        this.printHelper.printReport({
          title: t('REPORTS.STOCK_REPORTS'),
          subtitle: t('REPORTS.STOCK_DESC'),
          data: categoryRows,
          columns: [
            { key: 'categoryName', label: t('PRODUCTS.CATEGORY'), width: '40%' },
            { key: 'itemCount', label: t('STOCK.ITEM_COUNT'), type: 'number', width: '30%' },
            { key: 'totalValue', label: t('STOCK.TOTAL_VALUE'), type: 'currency', width: '30%' }
          ],
          summary: [
            { label: t('STOCK.TOTAL_ITEMS'), value: data.totalItems || 0, type: 'number' },
            { label: t('STOCK.TOTAL_VALUE'), value: data.totalStockValue || 0, type: 'currency' },
            { label: t('STOCK_ALERTS.LOW_STOCK'), value: data.lowStockItems || 0, type: 'number' },
            { label: t('STOCK_ALERTS.EXPIRED'), value: data.expiredItems || 0, type: 'number' }
          ],
          direction: isArabic ? 'rtl' : 'ltr'
        });
      } else if (this.activeTable() === 'low-stock' && data.lowStockProducts?.length) {
        const lowStockRows = data.lowStockProducts.map(item => ({
          productName: item.productName || t('PRODUCTS.UNNAMED'),
          currentStock: item.currentStock || 0,
          minStock: item.minStock || 0,
          status: this.getStatusLabel(item.currentStock === 0 ? 'EXPIRED' : 'LOW')
        }));

        this.printHelper.printReport({
          title: t('REPORTS.STOCK_REPORTS'),
          subtitle: t('STOCK.LOW_STOCK_PRODUCTS'),
          data: lowStockRows,
          columns: [
            { key: 'productName', label: t('PRODUCTS.NAME'), width: '40%' },
            { key: 'currentStock', label: t('STOCK.CURRENT_STOCK'), type: 'number', width: '20%' },
            { key: 'minStock', label: t('PRODUCTS.MIN_STOCK_LEVEL'), type: 'number', width: '20%' },
            { key: 'status', label: t('COMMON.STATUS'), width: '20%' }
          ],
          summary: [
            { label: t('STOCK_ALERTS.LOW_STOCK'), value: data.lowStockItems || 0, type: 'number' },
            { label: t('STOCK_ALERTS.EXPIRED'), value: data.expiredItems || 0, type: 'number' }
          ],
          direction: isArabic ? 'rtl' : 'ltr'
        });
      } else if (this.activeTable() === 'expiring' && data.expiringProducts?.length) {
        const expiringRows = data.expiringProducts.map(item => {
          let status = 'WARNING';
          if (item.daysUntilExpiry <= 7) status = 'URGENT';
          else if (item.daysUntilExpiry > 30) status = 'OK';

          return {
            productName: item.productName || t('PRODUCTS.UNNAMED'),
            batchNumber: item.batchNumber || '-',
            expiryDate: item.expiryDate || '-',
            daysUntilExpiry: item.daysUntilExpiry || 0,
            currentStock: item.currentStock || 0,
            status: this.getStatusLabel(status)
          };
        });

        this.printHelper.printReport({
          title: t('REPORTS.EXPIRY_REPORTS'),
          subtitle: t('REPORTS.EXPIRY_DESC'),
          data: expiringRows,
          columns: [
            { key: 'productName', label: t('PRODUCTS.NAME'), width: '25%' },
            { key: 'batchNumber', label: t('STOCK.BATCH_NUMBER'), width: '15%' },
            { key: 'expiryDate', label: t('PRODUCTS.EXPIRY_DATE'), type: 'date', width: '15%' },
            { key: 'daysUntilExpiry', label: t('STOCK.DAYS_LEFT'), type: 'number', width: '15%' },
            { key: 'currentStock', label: t('STOCK.CURRENT_STOCK'), type: 'number', width: '15%' },
            { key: 'status', label: t('COMMON.STATUS'), width: '15%' }
          ],
          summary: [
            { label: t('STOCK_ALERTS.EXPIRING_SOON'), value: data.expiringSoonItems || 0, type: 'number' },
            { label: t('STOCK_ALERTS.EXPIRED'), value: data.expiredItems || 0, type: 'number' }
          ],
          direction: isArabic ? 'rtl' : 'ltr'
        });
      }

      this.exportLoading.set(false);
      this.errorHandler.showSuccess('REPORTS.PRINT_SUCCESS');
    } catch (err) {
      this.exportLoading.set(false);
      this.errorHandler.showError('REPORTS.PRINT_ERROR');
    }
  }

  exportExcel(): void {
    this.exportLoading.set(true);
    this.exportService.exportReport({
      fileName: `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      fileType: 'excel',
      endpoint: '/stock/excel',
      params: { storeId: this.getStoreId() },
      preview: false,
      onError: () => {
        this.exportLoading.set(false);
        this.errorHandler.showError('REPORTS.EXPORT_ERROR');
      }
    }).subscribe({
      next: () => {
        this.exportLoading.set(false);
        this.errorHandler.showSuccess('REPORTS.EXPORT_SUCCESS');
      },
      error: () => {
        this.exportLoading.set(false);
        this.errorHandler.showError('REPORTS.EXPORT_ERROR');
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  getStatusLabel(status: string): string {
    const keyMap: Record<string, string> = {
      'urgent': 'STOCK.STATUS.URGENT',
      'warning': 'STOCK.STATUS.WARNING',
      'ok': 'STOCK.STATUS.GOOD',
      'EXPIRED': 'STOCK.STATUS.EXPIRED',
      'LOW': 'STOCK.STATUS.LOW'
    };
    const key = keyMap[status] || status;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : status;
  }

  getStatusColor(status: string): 'warn' | 'accent' | 'primary' {
    const colors: Record<string, 'warn' | 'accent' | 'primary'> = {
      'urgent': 'warn',
      'warning': 'accent',
      'ok': 'primary'
    };
    return colors[status] || 'primary';
  }

  getRowsClass(index: number): string {
    return index % 2 === 0 ? 'row-even' : 'row-odd';
  }

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }
}
