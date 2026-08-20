import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { PasswordChangeRequest, Profile, ProfileUpdateRequest } from '../../models/settings/profile.model';
import { ApiResponse } from '../../models/sale.model';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/profile`;

  private getUserId(): number {
    return this.authService.getUserId() || 1;
  }

  getProfile(): Observable<Profile> {
    const userId = this.getUserId();

    return this.http.get<ApiResponse<Profile>>(this.apiUrl, {
      params: new HttpParams().set('userId', userId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<Profile>('getProfile'))
    );
  }

  updateProfile(request: ProfileUpdateRequest): Observable<Profile> {
    const userId = this.getUserId();

    return this.http.put<ApiResponse<Profile>>(this.apiUrl, request, {
      params: new HttpParams().set('userId', userId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<Profile>('updateProfile'))
    );
  }

  changePassword(request: PasswordChangeRequest): Observable<Profile> {
    const userId = this.getUserId();

    return this.http.post<ApiResponse<Profile>>(`${this.apiUrl}/change-password`, {
      oldPassword: request.oldPassword,
      newPassword: request.newPassword
    }, {
      params: new HttpParams().set('userId', userId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<Profile>('changePassword'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
