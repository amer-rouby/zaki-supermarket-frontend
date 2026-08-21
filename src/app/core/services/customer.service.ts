import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginatedResponse } from '../models';
import { Customer, CustomerPaymentRequest, CustomerRequest, CustomerStatement } from '../models/customer.model';
import { StoreContextService } from './store-context.service';
import { withHttpErrorFallback } from '../utils/http-error.util';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(StoreContextService);
  private readonly apiUrl = this.store.apiUrl('customers');

  getCustomers(page: number = 0, size: number = 10): Observable<PaginatedResponse<Customer>> {
    return this.http.get<ApiResponse<PaginatedResponse<Customer>>>(`${this.apiUrl}/paginated`, {
      params: this.store.storeParams({ page, size })
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<PaginatedResponse<Customer>>('getCustomers')
    );
  }

  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Customer[]>('getAllCustomers', [])
    );
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Customer>('getCustomer')
    );
  }

  createCustomer(request: CustomerRequest): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, request, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Customer>('createCustomer')
    );
  }

  updateCustomer(id: number, request: CustomerRequest): Observable<Customer> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, request, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Customer>('updateCustomer')
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<void>('deleteCustomer')
    );
  }

  searchCustomers(query: string): Observable<Customer[]> {
    return this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}/search`, {
      params: this.store.storeParams({ query })
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Customer[]>('searchCustomers', [])
    );
  }

  getStatement(id: number): Observable<CustomerStatement | null> {
    return this.http.get<ApiResponse<CustomerStatement>>(`${this.apiUrl}/${id}/statement`, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<CustomerStatement | null>('getStatement', null)
    );
  }

  recordPayment(id: number, request: CustomerPaymentRequest): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(`${this.apiUrl}/${id}/payment`, request, {
      params: this.store.storeParams()
    }).pipe(
      map((response) => response.data),
      withHttpErrorFallback<Customer>('recordPayment')
    );
  }
}
