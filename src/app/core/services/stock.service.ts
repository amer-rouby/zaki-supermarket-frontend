import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { StockBatch, StockAdjustmentHistory } from '../models/stock.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class StockBatchService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/stock/batches`;

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private getCommonParams(storeId: number): HttpParams {
    return new HttpParams().set('storeId', storeId);
  }

  getBatches(storeId: number, page: number = 0, size: number = 20): Observable<PaginatedResponse<StockBatch>> {
    const params = this.getCommonParams(storeId)
      .set('page', page)
      .set('size', size);
    return this.http
      .get<ApiResponse<PaginatedResponse<StockBatch>>>(this.apiUrl, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getBatch(id: number, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .get<ApiResponse<StockBatch>>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  createBatch(batch: Partial<StockBatch>, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .post<ApiResponse<StockBatch>>(this.apiUrl, batch, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  updateBatch(id: number, batch: Partial<StockBatch>, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .put<ApiResponse<StockBatch>>(`${this.apiUrl}/${id}`, batch, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  deleteBatch(id: number, storeId: number): Observable<void> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getProducts(storeId: number = 4): Observable<Product[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .get<ApiResponse<Product[]>>(`${environment.apiUrl}/products`, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getExpiringBatches(storeId: number, days: number = 30): Observable<StockBatch[]> {
    const params = this.getCommonParams(storeId).set('days', days);
    return this.http
      .get<ApiResponse<StockBatch[]>>(`${this.apiUrl}/expiring`, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getExpiredBatches(storeId: number): Observable<StockBatch[]> {
    const params = this.getCommonParams(storeId);
    return this.http
      .get<ApiResponse<StockBatch[]>>(`${this.apiUrl}/expired`, { headers: this.getAuthHeaders(), params })
      .pipe(map((response) => response.data));
  }

  adjustStock(batchId: number, adjustment: any, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .post<ApiResponse<StockBatch>>(`${this.apiUrl}/${batchId}/adjust`, adjustment, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(map((response) => response.data));
  }

  getAdjustmentHistory(batchId: number, storeId: number): Observable<StockAdjustmentHistory[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http
      .get<ApiResponse<StockAdjustmentHistory[]>>(`${this.apiUrl}/${batchId}/adjustments`, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(map((response) => response.data));
  }
}
