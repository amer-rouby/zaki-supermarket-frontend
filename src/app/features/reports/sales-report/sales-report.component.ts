import { Component, inject, signal, OnInit, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TopProductsTableComponent } from '../../../shared/components/top-products-table/top-products-table.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MaterialModule } from '../../../shared/material.module';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartDataset } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExportService } from '../../../core/services/export.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { PrintHelperService } from '../../../core/services/print-helper.service';
import { DailySalesRow, ReportRequest, SalesReportData, TopProductRow } from '../../../core/models/Report.model';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MaterialModule,
    PageHeaderComponent,
    TopProductsTableComponent,
    EmptyStateComponent,
    BaseChartDirective
  ],
  templateUrl: './sales-report.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sales-report.component.scss'
})
export class SalesReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly exportService = inject(ExportService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly printHelper = inject(PrintHelperService);

  readonly startDate = signal<string>(this.formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))));
  readonly endDate = signal<string>(this.formatDate(new Date()));
  readonly reportType = signal<'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'>('MONTHLY');
  readonly salesReportData = signal<SalesReportData | null>(null);
  readonly reportLoading = signal(false);
  readonly reportError = signal<string>('');
  readonly exportLoading = signal(false);

  readonly dailySalesTableData = signal<DailySalesRow[]>([]);
  readonly topProductsTableData = signal<TopProductRow[]>([]);
  readonly dailySalesColumns = ['date', 'revenue', 'orders'];
  readonly activeTable = signal<'daily' | 'products'>('daily');

  readonly lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: '',
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.2)',
      tension: 0.4,
      fill: true
    }] as ChartDataset<'line'>[]
  };

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } }
  };

  readonly pieChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899']
    }] as ChartDataset<'doughnut'>[]
  };

  readonly pieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } }
  };

  constructor() {
    // Rebuild chart labels when language changes
    effect(() => {
      const _ = this.languageService.getCurrentLanguage();
      const data = this.salesReportData();
      if (data) {
        this.updateCharts(data);
      } else {
        // Update line chart label for current language
        this.lineChartData.datasets[0].label = this.translate.instant('REPORTS.SALES');
      }
    });
  }

  ngOnInit(): void {
    this.lineChartData.datasets[0].label = this.translate.instant('REPORTS.SALES');
    this.generateReport();
  }

  generateReport(): void {
    this.reportLoading.set(true);
    this.reportError.set('');

    const request: ReportRequest = {
      storeId: this.getStoreId(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      reportType: this.reportType()
    };

    this.reportService.getSalesReport(request).subscribe({
      next: (data) => {
        this.salesReportData.set(data);
        this.updateTables(data);
        this.updateCharts(data);
        this.reportLoading.set(false);
      },
      error: (err) => {
        this.reportError.set('REPORTS.LOAD_ERROR');
        this.reportLoading.set(false);
        this.errorHandler.handleHttpError(err, 'REPORTS.LOAD_ERROR');
      }
    });
  }

  private updateTables(data: SalesReportData): void {
    if (data.dailySales?.length) {
      this.dailySalesTableData.set(data.dailySales.map(s => ({
        date: s.date, revenue: s.revenue, orders: s.orders
      })));
    } else {
      this.dailySalesTableData.set([]);
    }
    if (data.topProducts?.length) {
      this.topProductsTableData.set(data.topProducts.map((p, i) => ({
        rank: i + 1,
        productName: p.productName,
        quantitySold: p.quantitySold,
        totalRevenue: p.totalRevenue
      })));
    } else {
      this.topProductsTableData.set([]);
    }
  }

  private updateCharts(data: SalesReportData): void {
    // Update line chart label with translation
    this.lineChartData.datasets[0].label = this.translate.instant('REPORTS.SALES');

    if (data.dailySales?.length) {
      this.lineChartData.labels = data.dailySales.map(d => d.date);
      this.lineChartData.datasets[0].data = data.dailySales.map(d => d.revenue);
    }
    if (data.revenueByPaymentMethod && Object.keys(data.revenueByPaymentMethod).length > 0) {
      this.pieChartData.labels = Object.keys(data.revenueByPaymentMethod).map(k =>
        this.translate.instant(`SALES.PAYMENT_METHOD.${k}`) !== `SALES.PAYMENT_METHOD.${k}`
          ? this.translate.instant(`SALES.PAYMENT_METHOD.${k}`)
          : this.getPaymentMethodLabel(k)
      );
      this.pieChartData.datasets[0].data = Object.values(data.revenueByPaymentMethod);
    }
  }

  setActiveTable(tab: 'daily' | 'products'): void {
    this.activeTable.set(tab);
  }

  exportPDF(): void {
    this.exportLoading.set(true);
    const data = this.salesReportData();
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

      // Prepare daily sales table data
      const dailySalesRows = (data.dailySales || []).map(sale => ({
        date: this.formatDateForPrint(sale.date),
        revenue: sale.revenue,
        orders: sale.orders
      }));

      // Prepare top products table data
      const topProductsRows = (data.topProducts || []).map((product, index) => ({
        rank: index + 1,
        productName: product.productName || t('PRODUCTS.UNNAMED'),
        quantitySold: product.quantitySold,
        totalRevenue: product.totalRevenue
      }));

      // Print daily sales report
      if (dailySalesRows.length > 0) {
        this.printHelper.printReport({
          title: t('REPORTS.SALES_REPORTS'),
          subtitle: t('REPORTS.SALES_DESC'),
          data: dailySalesRows,
          columns: [
            { key: 'date', label: t('REPORTS.DAILY_SALES'), type: 'date' },
            { key: 'revenue', label: t('REPORTS.TOTAL_REVENUE'), type: 'currency' },
            { key: 'orders', label: t('REPORTS.TOTAL_ORDERS'), type: 'number' }
          ],
          summary: [
            { label: t('REPORTS.TOTAL_REVENUE'), value: data.totalRevenue || 0, type: 'currency' },
            { label: t('REPORTS.TOTAL_ORDERS'), value: data.totalOrders || 0, type: 'number' },
            { label: t('REPORTS.AVERAGE_ORDER'), value: data.averageOrder || 0, type: 'currency' },
            { label: t('REPORTS.TOTAL_ITEMS'), value: data.totalItems || 0, type: 'number' }
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
      fileName: `sales_report_${this.startDate()}_to_${this.endDate()}.xlsx`,
      fileType: 'excel',
      endpoint: '/sales/excel',
      params: {
        storeId: this.getStoreId(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        reportType: this.reportType()
      },
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

  formatDateForPrint(dateStr: string): string {
    const lang = this.languageService.getCurrentLanguage();
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateForDisplay(dateStr: string): string {
    return this.formatDateForPrint(dateStr);
  }

  getPaymentMethodLabel(method: string): string {
    const key = `SALES.PAYMENT_METHOD.${method}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : method;
  }

  getRowsClass(index: number): string {
    return index % 2 === 0 ? 'row-even' : 'row-odd';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }
}
