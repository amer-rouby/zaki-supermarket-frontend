import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { DashboardStats } from '../models/dashboard.model';
import { ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;


  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  getDashboardStats(): Observable<DashboardStats> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<DashboardStats>>(
      `${this.baseUrl}/stats?storeId=${storeId}`,
      this.getAuthHeaders()
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        return throwError(() => new Error('Failed to load dashboard stats'));
      })
    );
  }
}
