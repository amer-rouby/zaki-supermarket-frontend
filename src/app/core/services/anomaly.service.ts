import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';
import { Anomaly, AnomalyCounts, AnomalyPage, AnomalyStatus, AnomalyType } from '../models/anomaly.model';

@Injectable({ providedIn: 'root' })
export class AnomalyService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('anomalies');

  private readonly emptyPage: AnomalyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };

  getAnomalies(status?: AnomalyStatus, type?: AnomalyType, page = 0, size = 20): Observable<AnomalyPage> {
    const params: Record<string, string | number> = { page, size };
    if (status) params['status'] = status;
    if (type) params['type'] = type;
    return this.http.get<ApiResponse<AnomalyPage>>(this.apiUrl, {
      params: this.store.storeParams(params)
    }).pipe(
      map((response) => response.data || this.emptyPage),
      withHttpErrorFallback<AnomalyPage>('getAnomalies', this.emptyPage)
    );
  }

  getCounts(): Observable<AnomalyCounts | null> {
    const empty: AnomalyCounts = { NEW: 0, REVIEWED: 0, DISMISSED: 0 };
    return this.http.get<ApiResponse<AnomalyCounts>>(`${this.apiUrl}/counts`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data || empty),
      withHttpErrorFallback<AnomalyCounts | null>('getCounts', null)
    );
  }

  markReviewed(id: number): Observable<Anomaly> {
    return this.http.put<ApiResponse<Anomaly>>(`${this.apiUrl}/${id}/review`, {}).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Anomaly>('markReviewed')
    );
  }

  dismiss(id: number): Observable<Anomaly> {
    return this.http.put<ApiResponse<Anomaly>>(`${this.apiUrl}/${id}/dismiss`, {}).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Anomaly>('dismiss')
    );
  }
}
