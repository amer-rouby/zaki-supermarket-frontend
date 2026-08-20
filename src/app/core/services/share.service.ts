// src/app/core/services/share.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShareLinkRequest {
  entityType: string;
  entityId: number;
  expiryHours?: number;
}

export interface ShareLinkResponse {
  shareUrl: string;
  token: string;
  expiresAt: string;
  entityType: string;
  entityId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/share`;

  createShareLink(request: ShareLinkRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  getSharedData(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${token}`);
  }
}
