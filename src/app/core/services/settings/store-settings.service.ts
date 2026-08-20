import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { ApiResponse } from '../../models';
import { StoreSettings, StoreSettingsRequest } from '../../models/settings/store-settings.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StoreSettingsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/settings/store`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  getSettings(): Observable<StoreSettings> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<StoreSettings>>(this.apiUrl, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<StoreSettings>('getSettings'))
    );
  }

  updateSettings(request: StoreSettingsRequest): Observable<StoreSettings> {
    const storeId = this.getStoreId();

    return this.http.put<ApiResponse<StoreSettings>>(this.apiUrl, request, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<StoreSettings>('updateSettings'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
