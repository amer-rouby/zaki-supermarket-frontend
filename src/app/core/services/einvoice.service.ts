import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';
import { EInvoiceSubmission } from '../models/einvoice.model';

@Injectable({ providedIn: 'root' })
export class EInvoiceService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('e-invoice');

  getForSale(saleId: number): Observable<EInvoiceSubmission | null> {
    return this.http.get<ApiResponse<EInvoiceSubmission>>(`${this.apiUrl}/${saleId}`).pipe(
      map((response) => response.data),
      withHttpErrorFallback<EInvoiceSubmission | null>('getForSale', null)
    );
  }

  submit(saleId: number): Observable<EInvoiceSubmission | null> {
    return this.http.post<ApiResponse<EInvoiceSubmission>>(`${this.apiUrl}/${saleId}/submit`, {}).pipe(
      map((response) => response.data),
      withHttpErrorFallback<EInvoiceSubmission | null>('submit', null)
    );
  }

  retry(saleId: number): Observable<EInvoiceSubmission | null> {
    return this.http.post<ApiResponse<EInvoiceSubmission>>(`${this.apiUrl}/${saleId}/retry`, {}).pipe(
      map((response) => response.data),
      withHttpErrorFallback<EInvoiceSubmission | null>('retry', null)
    );
  }
}
