import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models';
import { User, UserRequest, UsersCountResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  getUsersCount(): Observable<number> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<UsersCountResponse>>(`${this.apiUrl}/count`, {
      params: new HttpParams().set('storeId', storeId.toString())
    }).pipe(
      map(response => response.data?.count || 0),
      catchError(() => of(0))
    );
  }

  getUsers(): Observable<User[]> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of([]);
    }

    return this.http.get<ApiResponse<User[]>>(this.apiUrl, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<User[]>('getUsers', []))
    );
  }

  getActiveUsers(): Observable<User[]> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of([]);
    }

    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/active`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<User[]>('getActiveUsers', []))
    );
  }

  getUser(id: number): Observable<User> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<User>(`getUser id=${id}`))
    );
  }

  createUser(user: UserRequest): Observable<User> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    const request: UserRequest = {
      ...user,
      storeId
    };

    return this.http.post<ApiResponse<User>>(this.apiUrl, request).pipe(
      map(response => response.data),
      catchError(this.handleError<User>('createUser'))
    );
  }

  updateUser(id: number, user: UserRequest): Observable<User> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, user, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<User>(`updateUser id=${id}`))
    );
  }

  deleteUser(id: number): Observable<void> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<void>(`deleteUser id=${id}`))
    );
  }

  searchUsers(query: string): Observable<User[]> {
    const storeId = this.getStoreId();

    if (!storeId || !query?.trim()) {
      return of([]);
    }

    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/search`, {
      params: new HttpParams()
        .set('storeId', storeId)
        .set('query', query.trim())
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<User[]>('searchUsers', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
