import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';

export interface DemandPrediction {
  predictionId: number;
  productId: number;
  productName: string;
  productCode?: string;
  storeId: number;
  predictionDate: string;
  predictedQuantity: number;
  currentStock: number;
  recommendedOrder: number;
  confidenceLevel: number;
  algorithmVersion: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalityFactor: 'high' | 'medium' | 'low';
  recommendation: string;
  daysUntilStockout: number | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  createdAt: string;
}

export interface SalesHistoryPoint {
  date: string;
  quantity: number;
  sales: number;
}

export interface PredictionStats {
  averageAccuracy: number;
  totalPredictions: number;
  lastUpdated: string;
}

export interface PredictionsResponse {
  content: DemandPrediction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface UpdatePredictionDTO {
  predictedQuantity?: number;
  confidenceLevel?: number;
  recommendation?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class DemandPredictionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('predictions');

  getPredictions(page: number = 0, size: number = 10): Observable<DemandPrediction[]> {
    return this.http.get<ApiResponse<PredictionsResponse>>(this.apiUrl, {
      params: this.store.storeParams({ page, size })
    }).pipe(
      map((response) => response.data?.content || []),
      withHttpErrorFallback<DemandPrediction[]>('getPredictions', [])
    );
  }

  getPredictionsWithPagination(page: number = 0, size: number = 10): Observable<PredictionsResponse> {
    const empty: PredictionsResponse = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      first: true,
      last: true
    };
    return this.http.get<ApiResponse<PredictionsResponse>>(this.apiUrl, {
      params: this.store.storeParams({ page, size })
    }).pipe(
      map((response) => response.data || empty),
      withHttpErrorFallback<PredictionsResponse>('getPredictionsWithPagination', empty)
    );
  }

  getUpcomingPredictions(daysAhead: number = 7): Observable<DemandPrediction[]> {
    return this.http.get<ApiResponse<DemandPrediction[]>>(`${this.apiUrl}/upcoming`, {
      params: this.store.storeParams({ daysAhead })
    }).pipe(
      map((response) => response.data || []),
      withHttpErrorFallback<DemandPrediction[]>('getUpcomingPredictions', [])
    );
  }

  generatePredictions(forDate?: string): Observable<void> {
    const params = forDate
      ? this.store.storeParams({ forDate })
      : this.store.storeParams();
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/generate`, null, { params }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<void>('generatePredictions')
    );
  }

  getAccuracyStats(): Observable<PredictionStats> {
    const fallback: PredictionStats = {
      averageAccuracy: 0,
      totalPredictions: 0,
      lastUpdated: new Date().toISOString()
    };
    return this.http.get<ApiResponse<PredictionStats>>(`${this.apiUrl}/accuracy`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data || fallback),
      withHttpErrorFallback<PredictionStats>('getAccuracyStats', fallback)
    );
  }

  createPurchaseFromPrediction(predictionId: number): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.apiUrl}/${predictionId}/create-purchase`, {
        storeId: this.store.getStoreId()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<unknown>('createPurchaseFromPrediction')
      );
  }

  getPredictionDetails(predictionId: number): Observable<DemandPrediction> {
    return this.http.get<ApiResponse<DemandPrediction>>(`${this.apiUrl}/${predictionId}`).pipe(
      map((response) => response.data),
      withHttpErrorFallback<DemandPrediction>('getPredictionDetails')
    );
  }

  updatePrediction(predictionId: number, updates: UpdatePredictionDTO): Observable<DemandPrediction> {
    return this.http.put<ApiResponse<DemandPrediction>>(`${this.apiUrl}/${predictionId}`, updates).pipe(
      map((response) => response.data),
      withHttpErrorFallback<DemandPrediction>('updatePrediction')
    );
  }

  deletePrediction(predictionId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${predictionId}`).pipe(
      map((response) => response.data),
      withHttpErrorFallback<void>('deletePrediction')
    );
  }

  exportToPdf(predictionId: number): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${predictionId}/export/pdf`, { responseType: 'blob' })
      .pipe(withHttpErrorFallback<Blob>('exportToPdf'));
  }

  exportToExcel(predictionId: number): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${predictionId}/export/excel`, { responseType: 'blob' })
      .pipe(withHttpErrorFallback<Blob>('exportToExcel'));
  }

  getProductSalesHistory(productId: number, days: number = 30): Observable<SalesHistoryPoint[]> {
    return this.http.get<ApiResponse<SalesHistoryPoint[]>>(`${this.apiUrl}/sales-history`, {
      params: this.store.storeParams({ productId, days })
    }).pipe(
      map((response) => response.data || []),
      withHttpErrorFallback<SalesHistoryPoint[]>('getProductSalesHistory', [])
    );
  }

  sharePrediction(predictionId: number): Observable<{ shareUrl: string; expiresAt: string }> {
    return this.http
      .post<ApiResponse<{ shareUrl: string; expiresAt: string }>>(`${this.apiUrl}/${predictionId}/share`, {})
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<{ shareUrl: string; expiresAt: string }>('sharePrediction')
      );
  }
}
