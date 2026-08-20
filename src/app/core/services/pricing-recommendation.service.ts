import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';

export interface PricingRecommendation {
  productId: number;
  productName: string;
  productCode?: string;
  batchId: number | null;
  batchNumber: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  currentStock: number;
  reason: 'EXPIRING' | 'SLOW_MOVING';
  suggestedDiscountPercent: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PricingRecommendationService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('pricing-recommendations');

  getRecommendations(): Observable<PricingRecommendation[]> {
    return this.http.get<ApiResponse<PricingRecommendation[]>>(this.apiUrl, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data || []),
      withHttpErrorFallback<PricingRecommendation[]>('getRecommendations', [])
    );
  }
}
