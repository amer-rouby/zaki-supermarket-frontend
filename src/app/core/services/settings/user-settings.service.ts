import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserSettings, UserSettingsResponse } from '../../models/settings/user-settings.model';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private apiUrl = `${environment.apiUrl}/user/settings`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get user settings (session timeout configuration)
   */
  getSettings(): Observable<UserSettingsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserSettingsResponse>(this.apiUrl, { headers });
  }

  /**
   * Update user settings (session timeout)
   * @param sessionTimeout The new timeout value in minutes
   */
  updateSettings(sessionTimeout: number): Observable<UserSettingsResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<UserSettingsResponse>(
      this.apiUrl,
      { sessionTimeout },
      { headers }
    );
  }

  /**
   * Get auth headers with Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
