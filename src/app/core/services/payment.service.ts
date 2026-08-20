import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { StoreContextService } from './store-context.service';
import {
  Payment,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  PaymentStats
} from '../models/payment.model';
import { ApiResponse } from '../models';

export interface PaymentsResponse {
  content: Payment[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('payments');

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Payment service error:', error);
    if (error.status === 0) {
      return throwError(() => new Error('Connection error: Please check your network'));
    }
    if (error.error instanceof ErrorEvent) {
      return throwError(() => new Error(`Client error: ${error.error.message}`));
    }
    return throwError(() => new Error(error.error?.message || `Server error: ${error.status}`));
  }

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    const formattedRequest = {
      ...request,
      amount: parseFloat(request.amount.toString()),
      paymentMethod: request.paymentMethod?.toUpperCase()
    };

    return this.http.post<ApiResponse<PaymentResponse>>(
      `${this.apiUrl}/process`,
      formattedRequest,
      { headers: this.getHeaders().set('Content-Type', 'application/json') }
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  refundPayment(request: RefundRequest): Observable<PaymentResponse> {
    const params = new HttpParams()
      .set('amount', request.amount.toString())
      .set('reason', request.reason);

    return this.http.post<ApiResponse<PaymentResponse>>(
      `${this.apiUrl}/${request.paymentReference}/refund`,
      null,
      { params, headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  cancelPayment(paymentReference: string): Observable<PaymentResponse> {
    return this.http.post<ApiResponse<PaymentResponse>>(
      `${this.apiUrl}/${paymentReference}/cancel`,
      null,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  verifyPayment(paymentReference: string): Observable<PaymentResponse> {
    return this.http.get<ApiResponse<PaymentResponse>>(
      `${this.apiUrl}/${paymentReference}/verify`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  getPayments(
    storeId: number,
    page: number = 0,
    size: number = 10,
    status?: string,
    paymentMethod?: string,
    search?: string
  ): Observable<PaymentsResponse> {
    let params = new HttpParams()
      .set('storeId', storeId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (paymentMethod) {
      params = params.set('paymentMethod', paymentMethod);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ApiResponse<PaymentsResponse>>(
      this.apiUrl,
      { params, headers: this.getHeaders() }
    ).pipe(
      map(response => response.data || {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 0,
        first: true,
        last: true
      }),
      catchError(error => {
        console.error('Get payments error:', error);
        return throwError(() => error);
      })
    );
  }

  getPaymentStats(storeId: number): Observable<PaymentStats> {
    const params = new HttpParams().set('storeId', storeId.toString());

    return this.http.get<ApiResponse<PaymentStats>>(
      `${this.apiUrl}/stats`,
      { params, headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }
}
