import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Expense, ExpenseCategory, ExpenseSummary } from '../models/Expense.model';
import { environment } from '../../../environments/environment';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly baseUrl = `${environment.apiUrl}/expenses`;

  private getStoreId(): number {
    return this.authService.getStoreId() || 1;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  createExpense(expense: Expense): Observable<Expense> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.baseUrl, expense, { headers }).pipe(
      map(response => response.data)
    );
  }

  getExpenses(page: number = 0, size: number = 10): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('storeId', this.getStoreId())
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(this.baseUrl, { headers, params }).pipe(
      map(response => response.data)
    );
  }

  getExpenseById(id: number): Observable<Expense> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('storeId', this.getStoreId());
    return this.http.get<any>(`${this.baseUrl}/${id}`, { headers, params }).pipe(
      map(response => response.data)
    );
  }

  updateExpense(id: number, expense: Expense): Observable<Expense> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('storeId', this.getStoreId());
    return this.http.put<any>(`${this.baseUrl}/${id}`, expense, { headers, params }).pipe(
      map(response => response.data)
    );
  }

  deleteExpense(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('storeId', this.getStoreId());
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers, params });
  }

  getExpenseSummary(startDate?: string, endDate?: string): Observable<ExpenseSummary> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams().set('storeId', this.getStoreId());

    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any>(`${this.baseUrl}/summary`, { headers, params }).pipe(
      map(response => response.data)
    );
  }

  getExpenseCategories(): { value: ExpenseCategory; label: string }[] {
    const categories: ExpenseCategory[] = [
      'PURCHASES', 'SALARIES', 'RENT', 'UTILITIES', 'MAINTENANCE',
      'MARKETING', 'INSURANCE', 'LICENSES', 'TRANSPORT', 'OTHER'
    ];

    return categories.map(value => ({
      value,
      label: this.translate.instant(`EXPENSES.CATEGORIES.${value}`)
    }));
  }

  getPaymentMethods(): { value: string; label: string }[] {
    const methods = [
      'CASH', 'VISA', 'INSTAPAY', 'BANK_TRANSFER', 'WALLET'
    ];

    return methods.map(value => ({
      value,
      label: this.translate.instant(`COMMON.PAYMENT_METHODS.${value}`)
    }));
  }
}
