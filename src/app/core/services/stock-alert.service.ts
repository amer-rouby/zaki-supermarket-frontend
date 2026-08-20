import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models';
import { AlertStats, StockAlert } from '../models/stock-alert.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class StockAlertService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/alerts`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  getAlerts(): Observable<StockAlert[]> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<StockAlert[]>>(this.apiUrl, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<StockAlert[]>('getAlerts', []))
    );
  }

  getStats(): Observable<AlertStats> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<AlertStats>>(`${this.apiUrl}/stats`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<AlertStats>('getStats', {
        totalAlerts: 0,
        unreadAlerts: 0,
        lowStockAlerts: 0,
        expiredAlerts: 0,
        expiringSoonAlerts: 0,
        outOfStockAlerts: 0
      }))
    );
  }

  markAsRead(alertId: number): Observable<void> {
    const storeId = this.getStoreId();

    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${alertId}/read`, null, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<void>('markAsRead'))
    );
  }

  markAllAsRead(): Observable<void> {
    const storeId = this.getStoreId();

    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/read-all`, null, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<void>('markAllAsRead'))
    );
  }

  resolveAlert(alertId: number): Observable<void> {
    const storeId = this.getStoreId();

    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${alertId}/resolve`, null, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<void>('resolveAlert'))
    );
  }

  deleteAlert(alertId: number): Observable<void> {
    const storeId = this.getStoreId();

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${alertId}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<void>('deleteAlert'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
