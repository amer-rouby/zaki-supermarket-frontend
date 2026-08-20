import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { TopProductsTableComponent } from '../../../shared/components/top-products-table/top-products-table.component';
import { MaterialModule } from '../../../shared/material.module';
import { formatCurrency as formatCurrencyAmount, formatDateTime } from '../../../core/utils/format.util';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LanguageService } from '../../../core/services/language.service';
import { DashboardStats } from '../../../core/models/dashboard.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MaterialModule,
    MatSnackBarModule,
    PageHeaderComponent,
    EmptyStateComponent,
    TopProductsTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroy$ = new Subject<void>();

  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly hasError = computed(() => this.error().length > 0 && !this.loading());
  readonly showStats = computed(() => !this.loading() && !this.error() && !!this.stats());
  readonly hasTopProducts = computed(() => this.showStats() && (this.stats()?.topProducts?.length ?? 0) > 0);
  readonly hasRecentSales = computed(() => this.showStats() && (this.stats()?.recentSales?.length ?? 0) > 0);
  readonly hasAlerts = computed(() => {
    if (!this.stats()) return false;
    const stats = this.stats()!;
    return stats.expiringBatches > 0 || stats.expiredBatches > 0 || stats.outOfStockProducts > 0;
  });

  readonly recentSalesColumns = ['invoiceNumber', 'totalAmount', 'transactionDate', 'paymentMethod'];

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardStats(): void {
    this.loading.set(true);
    this.error.set('');

    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('DASHBOARD.LOAD_ERROR');
          this.loading.set(false);
          this.errorHandler.handleHttpError(err, 'DASHBOARD.LOAD_ERROR');
        }
      });
  }

  refreshData(): void {
    this.loadDashboardStats();
    this.errorHandler.showSuccess('DASHBOARD.REFRESH_SUCCESS');
  }

  formatCurrency(amount: number): string {
    return formatCurrencyAmount(amount, this.languageService.getCurrentLanguage());
  }

  formatDate(dateString: string): string {
    return formatDateTime(dateString, this.languageService.getCurrentLanguage());
  }

  getPaymentMethodArabic(method: string): string {
    const methods: Record<string, string> = {
      'CASH': this.translate.instant('SALES.PAYMENT_METHOD.CASH'),
      'VISA': this.translate.instant('SALES.PAYMENT_METHOD.VISA'),
      'INSTAPAY': this.translate.instant('SALES.PAYMENT_METHOD.INSTAPAY'),
      'WALLET': this.translate.instant('SALES.PAYMENT_METHOD.WALLET'),
      'CREDIT': this.translate.instant('SALES.PAYMENT_METHOD.CREDIT'),
      'FAWRY': this.translate.instant('SALES.PAYMENT_METHOD.FAWRY'),
      'BANK_TRANSFER': this.translate.instant('SALES.PAYMENT_METHOD.BANK_TRANSFER'),
    };
    return methods[method] || method;
  }

  getPaymentChipColor(method: string): 'primary' | 'accent' | 'warn' {
    const colors: Record<string, 'primary' | 'accent' | 'warn'> = {
      'CASH': 'primary',
      'VISA': 'accent',
      'INSTAPAY': 'accent',
      'FAWRY': 'accent',
      'BANK_TRANSFER': 'accent',
      'WALLET': 'primary',
      'CREDIT': 'warn'
    };
    return colors[method] || 'primary';
  }

  viewLowStockProducts(): void {
    this.errorHandler.showWarning('DASHBOARD.STOCK_ALERTS_BTN');
  }

  viewAllSales(): void {
    this.router.navigate(['/sales/history']);
  }
}
