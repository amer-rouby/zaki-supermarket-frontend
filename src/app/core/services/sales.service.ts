import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { SaleRequest } from '../models';
import {
  ApiResponse,
  CategorySales,
  ProductSales,
  SaleResponse,
  SalesAnalytics,
  SaleSearchResult,
  TodaySalesResponse,
  AnalyticsApiRaw,
  ProductApiRaw,
  CategoryApiRaw,
  SalesTrend,
  PaymentMethodStats
} from '../models/sale.model';
import { PaginatedResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  private translatePayment(code: string): string {
    const map: Record<string, string> = {
      'CASH': 'نقدي', 'CREDIT_CARD': 'بطاقة ائتمان', 'DEBIT_CARD': 'بطاقة خصم',
      'ONLINE': 'دفع إلكتروني', 'INSURANCE': 'تأمين', 'VISA': 'فيزا', 'MASTERCARD': 'ماستركارد'
    };
    return map[code.toUpperCase()] || code;
  }

  private formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return date; }
  }

  private mapAnalytics(raw: AnalyticsApiRaw): SalesAnalytics {
    const totalRevenue = raw.totalRevenue || 0;

    const paymentMethods: PaymentMethodStats[] = Object.entries(raw.revenueByPaymentMethod || {})
      .map(([method, amount]) => ({
        method: this.translatePayment(method),
        count: 1,
        amount: amount as number,
        percentage: totalRevenue > 0 ? Math.round(((amount as number) / totalRevenue) * 100) : 0
      }));

    const avgOrder = raw.averageOrder || 0;
    const salesTrend: SalesTrend[] = Object.entries(raw.ordersByDay || {})
      .map(([date, sales]) => {
        const salesCount = sales as number;
        return {
          date,
          revenue: salesCount * avgOrder,
          sales: salesCount,
          label: this.formatDate(date),
          value: salesCount * avgOrder
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalRevenue,
      totalSales: raw.totalOrders || 0,
      averageOrderValue: raw.averageOrder || 0,
      totalItems: raw.totalItems || 0,
      profit: raw.profit ?? (totalRevenue * 0.3),
      profitMargin: raw.profitMargin ?? 30,
      paymentMethods,
      salesTrend,
      dailyComparison: [],
      trendData: salesTrend
    };
  }

  private mapProducts(raw: ProductApiRaw[]): ProductSales[] {
    if (!raw?.length) return [];
    const totalRevenue = raw.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
    return raw.map(p => ({
      productId: p.productId,
      productName: p.productName,
      quantity: p.totalQuantity || p.quantitySold || 0,
      revenue: p.totalRevenue || 0,
      percentage: totalRevenue > 0 ? Math.round(((p.totalRevenue || 0) / totalRevenue) * 100) : 0
    }));
  }

  private mapCategories(raw: CategoryApiRaw): CategorySales[] {
    if (!raw?.salesByCategory) return [];
    return Object.entries(raw.salesByCategory)
      .map(([name, revenue], idx) => ({
        categoryId: idx + 1,
        categoryName: name,
        revenue: revenue as number,
        sales: 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  getTodaySalesSummary(): Observable<TodaySalesResponse> {
    return this.http.get<ApiResponse<TodaySalesResponse>>(`${this.baseUrl}/sales/today/summary`, {
      params: { storeId: this.getStoreId().toString() }
    }).pipe(
      map(response => response.data || { totalAmount: 0, count: 0 }),
      catchError(() => throwError(() => new Error('Failed to load sales summary')))
    );
  }

  getTodaySales(): Observable<TodaySalesResponse> {
    return this.http.get<ApiResponse<TodaySalesResponse>>(`${this.baseUrl}/sales/today`, {
      params: { storeId: this.getStoreId().toString() }
    }).pipe(
      map(response => response.data || { totalAmount: 0, count: 0 }),
      catchError(() => throwError(() => new Error('Failed to load today sales')))
    );
  }

  getSalesStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/sales/stats`, {
      params: { storeId: this.getStoreId().toString() }
    }).pipe(
      map(response => response.data || {}),
      catchError(() => throwError(() => new Error('Failed to load sales stats')))
    );
  }

  getAllSales(storeId: number, page: number, size: number): Observable<PaginatedResponse<SaleResponse>> {
    return this.http.get<ApiResponse<PaginatedResponse<SaleResponse>>>(`${this.baseUrl}/sales`, {
      params: { storeId: storeId.toString(), page: page.toString(), size: size.toString() }
    }).pipe(
      map(response => response.data),
      catchError(() => throwError(() => new Error('Failed to load sales')))
    );
  }

  getSaleById(id: number): Observable<SaleResponse> {
    return this.http.get<ApiResponse<SaleResponse>>(`${this.baseUrl}/sales/${id}`, {
      params: { storeId: this.getStoreId().toString() }
    }).pipe(
      map(response => response.data),
      catchError(() => throwError(() => new Error('Failed to load sale')))
    );
  }

  createSale(request: SaleRequest): Observable<SaleResponse> {
    const storeId = this.getStoreId();
    return this.http.post<ApiResponse<SaleResponse>>(`${this.baseUrl}/sales?storeId=${storeId}`, { ...request, storeId })
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(error?.error?.message || 'Failed to create sale')))
      );
  }

  getRecentSales(limit: number = 10): Observable<SaleSearchResult[]> {
    return this.http.get<ApiResponse<SaleSearchResult[]>>(`${this.baseUrl}/sales/recent?storeId=${this.getStoreId()}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    }).pipe(
      map(response => response.data),
      catchError(() => throwError(() => new Error('Failed to load recent sales')))
    );
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sales/${id}`, {
      params: { storeId: this.getStoreId().toString() }
    }).pipe(catchError(() => throwError(() => new Error('Failed to delete sale'))));
  }

  searchSales(storeId: number, query: string): Observable<PaginatedResponse<SaleResponse>> {
    return this.http.get<ApiResponse<PaginatedResponse<SaleResponse>>>(`${this.baseUrl}/sales/search`, {
      params: { storeId: storeId.toString(), query }
    }).pipe(
      map(response => response.data),
      catchError(() => throwError(() => new Error('Failed to search sales')))
    );
  }

  getSalesByDateRange(startDate: string, endDate: string): Observable<PaginatedResponse<SaleResponse>> {
    return this.http.get<ApiResponse<PaginatedResponse<SaleResponse>>>(`${this.baseUrl}/sales/range`, {
      params: { storeId: this.getStoreId().toString(), startDate, endDate }
    }).pipe(
      map(response => response.data),
      catchError(() => throwError(() => new Error('Failed to load sales by date range')))
    );
  }

  getSalesAnalytics(params: { storeId: number; startDate?: string; endDate?: string; period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }): Observable<SalesAnalytics> {
    let httpParams = new HttpParams().set('storeId', params.storeId.toString());
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.period) httpParams = httpParams.set('period', params.period);

    return this.http.get<ApiResponse<AnalyticsApiRaw>>(`${this.baseUrl}/sales/analytics`, { params: httpParams })
      .pipe(
        map(response => this.mapAnalytics(response.data)),
        catchError(err => throwError(() => new Error(err?.error?.message || 'Failed to load sales analytics')))
      );
  }

  getTopSellingProducts(storeId: number, limit: number = 10): Observable<ProductSales[]> {
    return this.http.get<ApiResponse<ProductApiRaw[]>>(`${this.baseUrl}/sales/top-products`, {
      params: { storeId: storeId.toString(), limit: limit.toString() }
    }).pipe(
      map(response => this.mapProducts(response.data)),
      catchError(() => throwError(() => new Error('Failed to load top products')))
    );
  }

  getSalesByCategory(storeId: number, startDate: string, endDate: string): Observable<CategorySales[]> {
    return this.http.get<ApiResponse<CategoryApiRaw>>(`${this.baseUrl}/sales/by-category`, {
      params: { storeId: storeId.toString(), startDate, endDate }
    }).pipe(
      map(response => this.mapCategories(response.data)),
      catchError(() => throwError(() => new Error('Failed to load category sales')))
    );
  }
}
