import { Component, inject, signal, OnInit, effect, ChangeDetectionStrategy } from '@angular/core';
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
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { PrintHelperService } from '../../../core/services/print-helper.service';
import { FinancialReportData, ReportRequest } from '../../../core/models/Report.model';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule, MaterialModule,
    PageHeaderComponent, BaseChartDirective
  ],
  templateUrl: './financial-report.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './financial-report.component.scss'
})
export class FinancialReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly printHelper = inject(PrintHelperService);

  readonly startDate = signal<string>(this.formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))));
  readonly endDate = signal<string>(this.formatDate(new Date()));
  readonly reportType = signal<'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'>('MONTHLY');
  readonly financialData = signal<FinancialReportData | null>(null);
  readonly reportLoading = signal(false);
  readonly reportError = signal<string>('');
  readonly exportLoading = signal(false);

  readonly lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: '', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)', tension: 0.4, fill: true },
      { data: [], label: '', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', tension: 0.4, fill: true }
    ] as ChartDataset<'line'>[]
  };

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } }
  };

  readonly pieChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'] }] as ChartDataset<'doughnut'>[]
  };

  readonly pieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } }
  };

  constructor() {
    effect(() => {
      const _ = this.languageService.getCurrentLanguage();
      const data = this.financialData();
      if (data) {
        this.refreshChartLabels();
      }
    });
  }

  ngOnInit(): void {
    this.refreshChartLabels();
    this.generateReport();
  }

  private refreshChartLabels(): void {
    this.lineChartData.datasets[0].label = this.translate.instant('REPORTS.REVENUE');
    this.lineChartData.datasets[1].label = this.translate.instant('REPORTS.EXPENSES');
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

    this.reportService.getFinancialReport(request).subscribe({
      next: (data: FinancialReportData) => {
        this.financialData.set(data);
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

  private updateCharts(data: FinancialReportData): void {
    this.refreshChartLabels();
    if (data.monthlyData?.length) {
      this.lineChartData.labels = data.monthlyData.map(m => m.month);
      this.lineChartData.datasets[0].data = data.monthlyData.map(m => m.revenue);
      this.lineChartData.datasets[1].data = data.monthlyData.map(m => m.expenses);
    }
    if (data.expensesByCategory?.length) {
      this.pieChartData.labels = data.expensesByCategory.map(c => {
        const key = `EXPENSES.CATEGORIES.${c.category.toUpperCase()}`;
        const translated = this.translate.instant(key);
        return translated !== key ? translated : c.category;
      });
      this.pieChartData.datasets[0].data = data.expensesByCategory.map(c => c.amount);
    }
  }

  exportPDF(): void {
    this.exportLoading.set(true);
    const data = this.financialData();
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

      const monthlyRows = (data.monthlyData || []).map(m => ({
        month: m.month,
        revenue: m.revenue,
        expenses: m.expenses,
        profit: m.profit
      }));

      this.printHelper.printReport({
        title: t('REPORTS.FINANCIAL_REPORTS'),
        subtitle: t('REPORTS.FINANCIAL_DESC'),
        data: monthlyRows,
        columns: [
          { key: 'month', label: t('REPORTS.PERIOD'), width: '25%' },
          { key: 'revenue', label: t('REPORTS.REVENUE'), type: 'currency', width: '25%' },
          { key: 'expenses', label: t('REPORTS.EXPENSES'), type: 'currency', width: '25%' },
          { key: 'profit', label: t('REPORTS.PROFIT'), type: 'currency', width: '25%' }
        ],
        summary: [
          { label: t('REPORTS.TOTAL_REVENUE'), value: data.totalRevenue || 0, type: 'currency' },
          { label: t('REPORTS.TOTAL_EXPENSES'), value: data.totalExpenses || 0, type: 'currency' },
          { label: t('REPORTS.NET_PROFIT'), value: data.netProfit || 0, type: 'currency' },
          { label: t('REPORTS.PROFIT_MARGIN'), value: `${data.profitMargin || 0}%`, type: 'text' }
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
