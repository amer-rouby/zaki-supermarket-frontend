import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { ApiResponse } from '../../models';
import { SecuritySettings } from '../../models/settings/security-settings.model';
import { PasswordChangeRequest } from '../../models/settings/profile.model';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SecuritySettingsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/settings/security`;

  private getUserId(): number {
    const user = this.authService.getCurrentUser();
    return user?.userId || 1;
  }

  getSettings(): Observable<SecuritySettings> {
    const userId = this.getUserId();

    return this.http.get<ApiResponse<SecuritySettings>>(this.apiUrl, {
      params: new HttpParams().set('userId', userId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<SecuritySettings>('getSettings'))
    );
  }

  changePassword(request: PasswordChangeRequest): Observable<SecuritySettings> {
    const userId = this.getUserId();

    return this.http.post<ApiResponse<SecuritySettings>>(`${this.apiUrl}/change-password`, {
      oldPassword: request.oldPassword,
      newPassword: request.newPassword
    }, {
      params: new HttpParams().set('userId', userId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<SecuritySettings>('changePassword'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
