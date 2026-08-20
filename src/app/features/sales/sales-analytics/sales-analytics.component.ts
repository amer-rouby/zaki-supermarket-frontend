import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { SalesService } from '../../../core/services/sales.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ExportService } from '../../../core/services/export.service';
import { PrintHelperService } from '../../../core/services/print-helper.service';
import { CategorySales, ProductSales, SalesAnalytics, SalesAnalyticsParams } from '../../../core/models/sale.model';
import { MaterialModule } from '../../../shared/material.module';
import { FilterState, PeriodType, StatCard } from '../../../core/models';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MaterialModule],
  templateUrl: './sales-analytics.component.html',
  styleUrl: './sales-analytics.component.scss'
})
export class SalesAnalyticsComponent implements OnInit, OnDestroy {
  private readonly salesService = inject(SalesService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly exportService = inject(ExportService);
  private readonly printHelper = inject(PrintHelperService);
  private readonly currencyService = inject(CurrencyService);
  private readonly destroy$ = new Subject<void>();

  // ✅ إضافة currentLang signal
  readonly currentLang = signal<string>(this.translate.currentLang || 'ar');

  readonly state = signal<{
    analytics: SalesAnalytics | null;
    topProducts: ProductSales[];
    categorySales: CategorySales[];
    loading: boolean;
    error: string | null;
    storeId: number;
  }>({
    analytics: null,
    topProducts: [],
    categorySales: [],
    loading: false,
    error: null,
    storeId: 1
  });

  readonly filters = signal<FilterState>({
    period: 'monthly',
    startDate: '',
    endDate: ''
  });

  readonly statsCards: StatCard[] = [
    { key: 'totalRevenue', label: 'REPORTS.TOTAL_REVENUE', icon: 'attach_money', class: 'revenue' },
    { key: 'totalSales', label: 'REPORTS.TOTAL_SALES', icon: 'receipt_long', class: 'sales' },
    { key: 'averageOrderValue', label: 'REPORTS.AVERAGE_ORDER', icon: 'shopping_cart', class: 'average' },
    { key: 'profit', label: 'REPORTS.PROFIT', icon: 'account_balance_wallet', class: 'profit', showMargin: true }
  ];

  readonly hasData = computed(() => !this.state().loading && !!this.state().analytics);
  readonly hasTopProducts = computed(() => this.state().topProducts.length > 0);
  readonly hasCategorySales = computed(() => this.state().categorySales.length > 0);
  readonly trendData = computed(() => this.state().analytics?.trendData ?? []);
  readonly analytics = computed(() => this.state().analytics);

  readonly periods: { value: PeriodType; label: string }[] = [
    { value: 'daily', label: 'REPORTS.DAILY' },
    { value: 'weekly', label: 'REPORTS.WEEKLY' },
    { value: 'monthly', label: 'REPORTS.MONTHLY' },
    { value: 'yearly', label: 'REPORTS.YEARLY' }
  ];

  ngOnInit(): void {
    this.initialize();
    this.setupLanguageSubscription();
  }

  // ✅ دالة لمتابعة تغيير اللغة
  private setupLanguageSubscription(): void {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(event => {
      this.currentLang.set(event.lang);
    });
  }

  private initialize(): void {
    this.setStoreId();
    this.setDefaultDates();
    this.loadData();
  }

  private setStoreId(): void {
    const id = this.authService.getStoreId() ?? 1;
    this.state.update(s => ({ ...s, storeId: id }));
  }

  private setDefaultDates(): void {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filters.update(f => ({
      ...f,
      startDate: first.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }));
  }

  private loadData(): void {
    if (this.state().storeId <= 0) return;

    this.state.update(s => ({ ...s, loading: true, error: null }));

    const params: SalesAnalyticsParams = {
      storeId: this.state().storeId,
      ...this.filters()
    };

    const analytics$ = this.salesService.getSalesAnalytics(params);
    const topProducts$ = this.salesService.getTopSellingProducts(this.state().storeId);
    const categorySales$ = this.salesService.getSalesByCategory(
      this.state().storeId,
      this.filters().startDate,
      this.filters().endDate
    );

    forkJoin({
      analytics: analytics$,
      topProducts: topProducts$,
      categorySales: categorySales$
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: results => {
        this.state.update(s => ({
          ...s,
          analytics: results.analytics,
          topProducts: results.topProducts,
          categorySales: results.categorySales,
          loading: false,
          error: null
        }));
      },
      error: err => {
        this.state.update(s => ({
          ...s,
          loading: false,
          error: 'REPORTS.LOAD_ERROR'
        }));
        this.errorHandler.handleHttpError(err, 'REPORTS.LOAD_ERROR');
      }
    });
  }

  onFilterChange(): void {
    this.loadData();
  }

  onRefresh(): void {
    this.setDefaultDates();
    this.loadData();
    this.errorHandler.showSuccess('REPORTS.REFRESH_SUCCESS');
  }

  onExport(format: 'excel' | 'pdf'): void {
    const storeId = this.state().storeId;
    const { startDate, endDate } = this.filters();

    if (!startDate || !endDate) {
      this.errorHandler.showWarning('REPORTS.EXPORT_NO_DATE_RANGE');
      return;
    }

    if (format === 'excel') {
      this.exportService.exportSalesExcel(storeId, startDate, endDate).subscribe({
        error: (err) => this.errorHandler.handleHttpError(err, 'REPORTS.EXPORT_ERROR')
      });
      return;
    }

    // PDF used to be a server-rendered file loaded into a full-screen iframe - it
    // looked nothing like the rest of the app (no letterhead, backend's own plain
    // table styling). Building it the same way as every other report (stock/expiry/
    // financial) keeps every printed document visually consistent.
    const t = (key: string): string => {
      const val = this.translate.instant(key);
      return val && val !== key ? val : key;
    };
    const analytics = this.state().analytics;
    const isArabic = this.currentLang() === 'ar';

    this.printHelper.printReport({
      title: t('SALES.ANALYTICS_TITLE') || 'Sales Report',
      subtitle: `${startDate} - ${endDate}`,
      data: this.state().topProducts.map(p => ({
        productName: p.productName,
        quantity: p.quantity,
        revenue: p.revenue
      })),
      columns: [
        { key: 'productName', label: t('PRODUCTS.NAME'), width: '50%' },
        { key: 'quantity', label: t('SALES.QUANTITY'), type: 'number', width: '20%' },
        { key: 'revenue', label: t('SALES.TOTAL_PRICE'), type: 'currency', width: '30%' }
      ],
      summary: analytics ? [
        { label: t('REPORTS.TOTAL_REVENUE'), value: analytics.totalRevenue, type: 'currency' },
        { label: t('REPORTS.TOTAL_ORDERS'), value: analytics.totalSales, type: 'number' },
        { label: t('REPORTS.AVERAGE_ORDER'), value: analytics.averageOrderValue, type: 'currency' }
      ] : [],
      direction: isArabic ? 'rtl' : 'ltr'
    });
  }

  calculateBarHeight(value: number): number {
    const data = this.trendData();
    if (!data?.length) return 10;
    const max = Math.max(...data.map(d => d.revenue));
    return max > 0 ? Math.max(10, (value / max) * 100) : 10;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.currentLang() === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: this.currencyService.getCode(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getStatValue(key: string): string {
    const analytics = this.state().analytics;
    if (!analytics) return '-';
    switch (key) {
      case 'totalRevenue':
      case 'averageOrderValue':
      case 'profit':
        return this.formatCurrency(analytics[key as keyof SalesAnalytics] as number);
      case 'totalSales':
        return (analytics[key as keyof SalesAnalytics] as number)?.toString() ?? '0';
      default:
        return '-';
    }
  }

  getProfitClass(margin?: number): string {
    if (margin === undefined) return '';
    return margin >= 0 ? 'positive' : 'negative';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
