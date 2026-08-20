import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models';
import { CreateMovementRequest, StockMovement, StockMovementStats } from '../models/Stock-movement.model';
import { environment } from '../../../environments/environment';

export interface StockMovementPage {
  content: StockMovement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

const EMPTY_PAGE: StockMovementPage = {
  content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true
};

@Injectable({
  providedIn: 'root'
})
export class StockMovementService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/stock/movements`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  getMovements(page: number = 0, size: number = 20): Observable<StockMovementPage> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<StockMovementPage>>(`${this.apiUrl}/store/${storeId}`, {
      params: new HttpParams()
        .set('page', page)
        .set('size', size)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<StockMovementPage>('getMovements', EMPTY_PAGE))
    );
  }

  getMovementsByBatch(batchId: number, page: number = 0, size: number = 20): Observable<StockMovementPage> {
    return this.http.get<ApiResponse<StockMovementPage>>(`${this.apiUrl}/batch/${batchId}`, {
      params: new HttpParams()
        .set('page', page)
        .set('size', size)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<StockMovementPage>('getMovementsByBatch', EMPTY_PAGE))
    );
  }

  getMovementsByDateRange(
    startDate: string,
    endDate: string,
    movementType?: string,
    page: number = 0,
    size: number = 20
  ): Observable<StockMovementPage> {
    const storeId = this.getStoreId();

    let params = new HttpParams()
      .set('storeId', storeId)
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page)
      .set('size', size);
    if (movementType && movementType !== 'all') {
      params = params.set('movementType', movementType);
    }

    return this.http.get<ApiResponse<StockMovementPage>>(`${this.apiUrl}/date-range`, { params }).pipe(
      map(response => response.data),
      catchError(this.handleError<StockMovementPage>('getMovementsByDateRange', EMPTY_PAGE))
    );
  }

  getStats(startDate: string, endDate: string): Observable<StockMovementStats> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<StockMovementStats>>(`${this.apiUrl}/stats`, {
      params: new HttpParams()
        .set('storeId', storeId)
        .set('startDate', startDate)
        .set('endDate', endDate)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<StockMovementStats>('getStats', {
        totalMovements: 0,
        totalStockIn: 0,
        totalStockOut: 0,
        totalAdjustments: 0,
        totalExpired: 0,
        totalTransferred: 0
      }))
    );
  }

  createMovement(request: CreateMovementRequest): Observable<StockMovement> {
    return this.http.post<ApiResponse<StockMovement>>(this.apiUrl, request).pipe(
      map(response => response.data),
      catchError(this.handleError<StockMovement>('createMovement'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
