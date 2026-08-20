import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponse, PaginatedResponse} from '../models';
import { Product, ProductRequest, ProductsCountResponse } from '../models/product.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  getProductsCount(): Observable<number> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<ProductsCountResponse>>(`${this.apiUrl}/count`, {
      params: new HttpParams().set('storeId', storeId.toString())
    }).pipe(
      map(response => response.data?.count || 0),
      catchError(error => {
        console.error('Error loading products count:', error);
        return of(0);
      })
    );
  }

  getProductsPaged(page: number, size: number, search?: string, category?: string,
                    sortBy = 'name', sortDirection = 'asc'): Observable<PaginatedResponse<Product>> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of(this.getEmptyPaginatedResponse<Product>());
    }

    let params = new HttpParams()
      .set('storeId', storeId)
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    if (search?.trim()) params = params.set('search', search.trim());
    if (category && category !== 'all') params = params.set('category', category);

    return this.http.get<ApiResponse<PaginatedResponse<Product>>>(`${this.apiUrl}/page`, { params }).pipe(
      map(response => response.data || this.getEmptyPaginatedResponse<Product>()),
      catchError(this.handleError<PaginatedResponse<Product>>('getProductsPaged', this.getEmptyPaginatedResponse()))
    );
  }

  getProductsList(): Observable<Product[]> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of([]);
    }

    return this.http.get<ApiResponse<Product[]>>(this.apiUrl, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<Product[]>('getProductsList', []))
    );
  }

  getProduct(id: number): Observable<Product> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.get<Product>(`${this.apiUrl}/${id}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<Product>(`getProduct id=${id}`))
    );
  }

  createProduct(product: ProductRequest): Observable<Product> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.post<Product>(this.apiUrl, product, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<Product>('createProduct'))
    );
  }

  updateProduct(id: number, product: ProductRequest): Observable<Product> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.put<Product>(`${this.apiUrl}/${id}`, product, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<Product>(`updateProduct id=${id}`))
    );
  }

  deleteProduct(id: number): Observable<void> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return throwError(() => new Error('Store ID is required'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<void>(`deleteProduct id=${id}`))
    );
  }

  searchProducts(query: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Product>> {
    const storeId = this.getStoreId();

    if (!storeId || !query?.trim()) {
      return of(this.getEmptyPaginatedResponse<Product>());
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search`, {
      params: new HttpParams()
        .set('storeId', storeId)
        .set('query', query.trim())
        .set('page', page)
        .set('size', size)
    }).pipe(
      catchError(this.handleError<PaginatedResponse<Product>>('searchProducts', this.getEmptyPaginatedResponse()))
    );
  }

  getLowStockProducts(): Observable<Product[]> {
    const storeId = this.getStoreId();

    if (!storeId) {
      return of([]);
    }

    return this.http.get<Product[]>(`${this.apiUrl}/low-stock`, {
      params: new HttpParams().set('storeId', storeId)
    }).pipe(
      catchError(this.handleError<Product[]>('getLowStockProducts', []))
    );
  }

  searchByBarcode(barcode: string): Observable<Product | null> {
    const storeId = this.getStoreId();

    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/search`, {
      params: new HttpParams()
        .set('storeId', storeId)
        .set('query', barcode)
    }).pipe(
      map(response => (response.data || []).find(p => p.barcode === barcode) || null),
      catchError(() => of(null))
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

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
