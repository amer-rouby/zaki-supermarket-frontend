import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models';
import { Category, CategoryRequest, CategoriesCountResponse } from '../models/category';
import { PaginatedResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  getCategoriesCount(): Observable<number> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<CategoriesCountResponse>>(`${this.apiUrl}/count`, {
      params: new HttpParams().set('storeId', storeId.toString())
    }).pipe(
      map(response => response.data?.count || 0),
      catchError(() => of(0))
    );
  }

  getCategories(): Observable<Category[]> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of([]);
    }

    return this.http.get<ApiResponse<Category[]>>(this.apiUrl, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<Category[]>('getCategories', []))
    );
  }

  getActiveCategories(): Observable<Category[]> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of([]);
    }

    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/active`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<Category[]>('getActiveCategories', []))
    );
  }

  getCategoriesPaged(page: number, size: number, search?: string): Observable<PaginatedResponse<Category>> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of(this.getEmptyPaginatedResponse<Category>());
    }

    let params = new HttpParams()
      .set('storeId', storeId)
      .set('page', page)
      .set('size', size);

    if (search?.trim()) params = params.set('search', search.trim());

    return this.http.get<ApiResponse<PaginatedResponse<Category>>>(`${this.apiUrl}/page`, { params }).pipe(
      map(response => response.data || this.getEmptyPaginatedResponse<Category>()),
      catchError(this.handleError<PaginatedResponse<Category>>('getCategoriesPaged', this.getEmptyPaginatedResponse()))
    );
  }

  private getEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      size: 0,
      number: 0,
      first: true,
      last: true,
      empty: true
    };
  }

  getCategory(id: number): Observable<Category> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<Category>(`getCategory id=${id}`))
    );
  }

  createCategory(category: CategoryRequest): Observable<Category> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    const request: CategoryRequest = {
      ...category,
      nameAr: category.nameAr || category.name,
      nameEn: category.nameEn || category.name,
      storeId
    };

    return this.http.post<ApiResponse<Category>>(this.apiUrl, request).pipe(
      map(response => response.data),
      catchError(this.handleError<Category>('createCategory'))
    );
  }

  updateCategory(id: number, category: CategoryRequest): Observable<Category> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    const request: CategoryRequest = {
      ...category,
      nameAr: category.nameAr || category.name,
      nameEn: category.nameEn || category.name,
      storeId
    };

    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, request, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data),
      catchError(this.handleError<Category>(`updateCategory id=${id}`))
    );
  }

  deleteCategory(id: number): Observable<void> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<void>(`deleteCategory id=${id}`))
    );
  }

  searchCategories(query: string): Observable<Category[]> {
    const storeId = this.getStoreId();

    if (!storeId || !query?.trim()) {
      return of([]);
    }

    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/search`, {
      params: new HttpParams()
        .set('storeId', storeId)
        .set('query', query.trim())
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<Category[]>('searchCategories', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
