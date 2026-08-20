import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginatedResponse } from '../models';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';
import { PurchaseOrder, PurchaseOrderStats, SendEmailResponse } from '../models/purchase-order.model';
import { PurchaseOrderRequest } from '../models/purchase-request.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('purchase-orders');

  getOrders(page: number = 0, size: number = 10): Observable<PaginatedResponse<PurchaseOrder>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PurchaseOrder>>>(this.apiUrl, {
        params: this.store.storeParams({ page, size })
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PaginatedResponse<PurchaseOrder>>('getOrders')
      );
  }

  getOrdersByStatus(
    status: string,
    page: number = 0,
    size: number = 10
  ): Observable<PaginatedResponse<PurchaseOrder>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<PurchaseOrder>>>(`${this.apiUrl}/status/${status}`, {
        params: this.store.storeParams({ page, size })
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PaginatedResponse<PurchaseOrder>>('getOrdersByStatus')
      );
  }

  getOrder(id: number): Observable<PurchaseOrder> {
    return this.http
      .get<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}`, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('getOrder')
      );
  }

  createOrder(request: PurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.http
      .post<ApiResponse<PurchaseOrder>>(this.apiUrl, request, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('createOrder')
      );
  }

  updateOrder(id: number, request: PurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.http
      .put<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}`, request, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('updateOrder')
      );
  }

  deleteOrder(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<void>('deleteOrder')
      );
  }

  approveOrder(id: number): Observable<PurchaseOrder> {
    return this.http
      .post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}/approve`, null, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('approveOrder')
      );
  }

  cancelOrder(id: number): Observable<PurchaseOrder> {
    return this.http
      .post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}/cancel`, null, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('cancelOrder')
      );
  }

  receiveOrder(id: number): Observable<PurchaseOrder> {
    return this.http
      .post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}/receive`, null, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('receiveOrder')
      );
  }

  getStats(): Observable<PurchaseOrderStats> {
    return this.http
      .get<ApiResponse<PurchaseOrderStats>>(`${this.apiUrl}/count`, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrderStats>('getStats')
      );
  }

  createFromPrediction(predictionId: number): Observable<PurchaseOrder> {
    return this.http
      .post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/from-prediction/${predictionId}`, null, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<PurchaseOrder>('createFromPrediction')
      );
  }

  // Deliberately no withHttpErrorFallback here - unlike a fetch, a failed send (no
  // supplier email on file, SMTP down, etc.) needs its real error message to reach
  // the caller so the UI can show *why* it failed, not swallow it into a generic result.
  sendEmail(orderId: number): Observable<SendEmailResponse> {
    return this.http
      .post<ApiResponse<SendEmailResponse>>(`${this.apiUrl}/${orderId}/send-email`, null, {
        params: this.store.storeParams()
      })
      .pipe(map((response) => response.data));
  }
}
