import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { WhatsAppData } from '../models/whatsapp.model';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';

export interface SendWhatsAppResponse {
  success: boolean;
  messageId?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('purchase-orders');

  getWhatsappData(orderId: number): Observable<WhatsAppData> {
    return this.http
      .get<ApiResponse<WhatsAppData>>(`${this.apiUrl}/${orderId}/whatsapp`, {
        params: this.store.storeParams()
      })
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<WhatsAppData>('getWhatsappData')
      );
  }

  sendWhatsApp(orderId: number): Observable<SendWhatsAppResponse> {
    return this.http
      .post<ApiResponse<SendWhatsAppResponse>>(
        `${this.apiUrl}/${orderId}/send-whatsapp`,
        null,
        { params: this.store.storeParams() }
      )
      .pipe(
        map((response) => response.data),
        withHttpErrorFallback<SendWhatsAppResponse>('sendWhatsApp')
      );
  }

  buildWhatsAppLink(data: WhatsAppData): string {
    const phone = (data.phoneNumber || '').replace(/^\+/, '');
    if (!phone) {
      throw new Error('Supplier phone number is missing');
    }
    const baseUrl = `https://wa.me/${phone}`;
    if (data.encodedMessage) {
      return `${baseUrl}?text=${data.encodedMessage}`;
    }
    return baseUrl;
  }
}
