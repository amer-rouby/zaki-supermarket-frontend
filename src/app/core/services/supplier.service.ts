import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginatedResponse } from '../models';
import { Supplier } from '../models/purchase-order.model';
import { SupplierRequest } from '../models/purchase-request.model';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('suppliers');

  getSuppliers(page: number = 0, size: number = 10): Observable<PaginatedResponse<Supplier>> {
    return this.http.get<ApiResponse<PaginatedResponse<Supplier>>>(`${this.apiUrl}/paginated`, {
      params: this.store.storeParams({ page, size })
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<PaginatedResponse<Supplier>>('getSuppliers')
    );
  }

  getAllSuppliers(): Observable<Supplier[]> {
    return this.http.get<ApiResponse<Supplier[]>>(this.apiUrl, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Supplier[]>('getAllSuppliers', [])
    );
  }

  getSupplier(id: number): Observable<Supplier> {
    return this.http.get<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Supplier>('getSupplier')
    );
  }

  createSupplier(request: SupplierRequest): Observable<Supplier> {
    return this.http.post<ApiResponse<Supplier>>(this.apiUrl, request, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Supplier>('createSupplier')
    );
  }

  updateSupplier(id: number, request: SupplierRequest): Observable<Supplier> {
    return this.http.put<ApiResponse<Supplier>>(`${this.apiUrl}/${id}`, request, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Supplier>('updateSupplier')
    );
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<void>('deleteSupplier')
    );
  }

  searchSuppliers(query: string): Observable<Supplier[]> {
    return this.http.get<ApiResponse<Supplier[]>>(`${this.apiUrl}/search`, {
      params: this.store.storeParams({ query })
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Supplier[]>('searchSuppliers', [])
    );
  }
}
