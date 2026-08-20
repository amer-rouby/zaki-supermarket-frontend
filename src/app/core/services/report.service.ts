import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ExpiryReportData, FinancialReportData, ReportRequest, SalesReportData, StockReportData } from '../models/Report.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getSalesReport(request: ReportRequest): Observable<SalesReportData> {
    return this.http.post<any>(`${this.baseUrl}/sales`, request).pipe(
      map(response => response.data)
    );
  }

  getFinancialReport(request: ReportRequest): Observable<FinancialReportData> {
    return this.http.post<any>(`${this.baseUrl}/financial`, request).pipe(
      map(response => response.data)
    );
  }

  getStockReport(request: ReportRequest): Observable<StockReportData> {
    return this.http.post<any>(`${this.baseUrl}/stock`, request).pipe(
      map(response => response.data)
    );
  }

  getExpiryReport(request: ReportRequest): Observable<ExpiryReportData> {
    return this.http.post<any>(`${this.baseUrl}/expiry`, request).pipe(
      map(response => response.data)
    );
  }
}
