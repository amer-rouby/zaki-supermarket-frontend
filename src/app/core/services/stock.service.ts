import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { StockBatch, StockBatchResponse, StockAdjustmentHistory } from '../models/stock.model';

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

  getBatches(storeId: number, page: number = 0, size: number = 20): Observable<any> {
    const params = this.getCommonParams(storeId)
      .set('page', page)
      .set('size', size);
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  getBatch(id: number, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<StockBatch>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  createBatch(batch: Partial<StockBatch>, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.post<StockBatch>(this.apiUrl, batch, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  updateBatch(id: number, batch: Partial<StockBatch>, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.put<StockBatch>(`${this.apiUrl}/${id}`, batch, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  deleteBatch(id: number, storeId: number): Observable<void> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getProducts(storeId: number = 4): Observable<any[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<any[]>(`${environment.apiUrl}/products`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getExpiringBatches(storeId: number, days: number = 30): Observable<StockBatch[]> {
    const params = this.getCommonParams(storeId).set('days', days);
    return this.http.get<StockBatch[]>(`${this.apiUrl}/expiring`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getExpiredBatches(storeId: number): Observable<StockBatch[]> {
    const params = this.getCommonParams(storeId);
    return this.http.get<StockBatch[]>(`${this.apiUrl}/expired`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  adjustStock(batchId: number, adjustment: any, storeId: number): Observable<StockBatch> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.post<StockBatch>(`${this.apiUrl}/${batchId}/adjust`, adjustment, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getAdjustmentHistory(batchId: number, storeId: number): Observable<StockAdjustmentHistory[]> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.get<StockAdjustmentHistory[]>(
      `${this.apiUrl}/${batchId}/adjustments`,
      { headers: this.getAuthHeaders(), params }
    );
  }
}
