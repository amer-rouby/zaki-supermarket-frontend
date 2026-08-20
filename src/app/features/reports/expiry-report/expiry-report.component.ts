import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartDataset } from 'chart.js';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExportService } from '../../../core/services/export.service';
import { ExpiryData, ReportRequest } from '../../../core/models/Report.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { PrintHelperService } from '../../../core/services/print-helper.service';


@Component({
  selector: 'app-expiry-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule, MaterialModule,
    PageHeaderComponent, BaseChartDirective
  ],
  templateUrl: './expiry-report.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './expiry-report.component.scss'
})
export class ExpiryReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly exportService = inject(ExportService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly printHelper = inject(PrintHelperService);

  readonly reportType = signal<'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'>('CUSTOM');
  readonly expiryData = signal<ExpiryData | null>(null);
  readonly reportLoading = signal(false);
  readonly reportError = signal<string>('');
  readonly exportLoading = signal(false);

  readonly displayedColumns = ['productName', 'batchNumber', 'expiryDate', 'daysUntilExpiry', 'currentStock', 'status'];

  readonly doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }] as ChartDataset<'doughnut'>[]
  };

  readonly doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } }
  };

  ngOnInit(): void {
    this.updateChartLabels();
    this.generateReport();
  }

  private updateChartLabels(): void {
    this.doughnutChartData.labels = [
      this.translate.instant('STOCK.STATUS.URGENT'),
      this.translate.instant('STOCK.STATUS.WARNING'),
      this.translate.instant('STOCK.STATUS.GOOD')
    ];
  }

  generateReport(): void {
    this.reportLoading.set(true);
    this.reportError.set('');

    const request: ReportRequest = {
      storeId: this.getStoreId(),
      reportType: this.reportType()
    };

    this.reportService.getExpiryReport(request).subscribe({
      next: (data: ExpiryData) => {
        this.expiryData.set(data);
        this.updateChart(data);
        this.reportLoading.set(false);
      },
      error: (err) => {
        this.reportError.set('REPORTS.LOAD_ERROR');
        this.reportLoading.set(false);
        this.errorHandler.handleHttpError(err, 'REPORTS.LOAD_ERROR');
      }
    });
  }

  private updateChart(data: ExpiryData): void {
    this.updateChartLabels();
    this.doughnutChartData.datasets[0].data = [
      data.urgentExpiring || 0,
      data.warningExpiring || 0,
      data.okExpiring || 0
    ];
  }

  exportPDF(): void {
    this.exportLoading.set(true);
    const data = this.expiryData();
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

      const tableData = (data.expiringProducts || []).map((product: any) => ({
        productName: product.productName || t('PRODUCTS.UNNAMED'),
        batchNumber: product.batchNumber || '-',
        expiryDate: product.expiryDate || '-',
        daysUntilExpiry: product.daysUntilExpiry || 0,
        currentStock: product.currentStock || 0,
        status: this.getStatusLabel(product.status || 'OK')
      }));

      this.printHelper.printReport({
        title: t('REPORTS.EXPIRY_REPORTS'),
        subtitle: t('REPORTS.EXPIRY_DESC'),
        data: tableData,
        columns: [
          { key: 'productName', label: t('PRODUCTS.NAME'), width: '25%' },
          { key: 'batchNumber', label: t('STOCK.BATCH_NUMBER'), width: '15%' },
          { key: 'expiryDate', label: t('PRODUCTS.EXPIRY_DATE'), type: 'date', width: '15%' },
          { key: 'daysUntilExpiry', label: t('STOCK.DAYS_LEFT'), type: 'number', width: '15%' },
          { key: 'currentStock', label: t('STOCK.CURRENT_STOCK'), type: 'number', width: '15%' },
          { key: 'status', label: t('COMMON.STATUS'), width: '15%' }
        ],
        summary: [
          { label: t('REPORTS.URGENT_EXPIRY'), value: data.urgentExpiring || 0, type: 'number' },
          { label: t('REPORTS.WARNING_EXPIRY'), value: data.warningExpiring || 0, type: 'number' },
          { label: t('REPORTS.OK_EXPIRY'), value: data.okExpiring || 0, type: 'number' },
          { label: t('REPORTS.TOTAL_EXPIRING'), value: (data.urgentExpiring || 0) + (data.warningExpiring || 0) + (data.okExpiring || 0), type: 'number' }
        ],
        direction: isArabic ? 'rtl' : 'ltr'
      });

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
      fileName: `expiry_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      fileType: 'excel',
      endpoint: '/expiry/excel',
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

  getStatusColor(status: string): 'warn' | 'accent' | 'primary' {
    const map: Record<string, 'warn' | 'accent' | 'primary'> = {
      'URGENT': 'warn', 'WARNING': 'accent', 'OK': 'primary'
    };
    return map[status] || 'primary';
  }

  getStatusLabel(status: string): string {
    const keyMap: Record<string, string> = {
      'URGENT': 'STOCK.STATUS.URGENT',
      'WARNING': 'STOCK.STATUS.WARNING',
      'OK': 'STOCK.STATUS.GOOD'
    };
    const key = keyMap[status] || status;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : status;
  }

  getRowsClass(index: number): string {
    return index % 2 === 0 ? 'row-even' : 'row-odd';
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }
}
