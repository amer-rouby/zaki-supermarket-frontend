import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { ExpenseService } from '../../../core/services/expense.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { Expense } from '../../../core/models/Expense.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MaterialModule
  ],
  templateUrl: "./add-expense-dialog.component.html",
  styleUrl: "./add-expense-dialog.component.scss"
})
export class AddExpenseDialogComponent implements OnInit, OnDestroy {
  private readonly expenseService = inject(ExpenseService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly dialogRef = inject(MatDialogRef<AddExpenseDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA);

  categories: { value: string; label: string }[] = [];
  paymentMethods: { value: string; label: string }[] = [];
  private langChangeSub?: Subscription;

  expense: Expense = {
    storeId: this.authService.getStoreId() || 1,
    category: 'PURCHASES',
    title: '',
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    referenceNumber: ''
  };

  expenseDate: Date = new Date();

  ngOnInit(): void {
    this.loadCategories();
    this.loadPaymentMethods();

    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.loadCategories();
      this.loadPaymentMethods();
    });

    if (this.data?.expense) {
      this.expense = { ...this.data.expense };
      this.expenseDate = new Date(this.data.expense.expenseDate);
    }
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  private loadCategories(): void {
    this.categories = this.expenseService.getExpenseCategories();
  }

  private loadPaymentMethods(): void {
    this.paymentMethods = this.expenseService.getPaymentMethods();
  }

  isValid(): boolean {
    const hasCategory = !!this.expense.category && this.expense.category.length > 0;
    const hasTitle = !!this.expense.title && this.expense.title.length > 0;
    const hasValidAmount = this.expense.amount > 0;
    const hasValidDate = this.expenseDate !== null && !isNaN(this.expenseDate.getTime());

    return hasCategory && hasTitle && hasValidAmount && hasValidDate;
  }

  onSubmit(): void {
    if (!this.isValid()) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.expense.expenseDate = this.formatDateForApi(this.expenseDate);

    this.expenseService.createExpense(this.expense).subscribe({
      next: () => {
        this.errorHandler.showSuccess('EXPENSES.ADD_SUCCESS');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.errorHandler.handleHttpError(error, 'EXPENSES.ADD_ERROR');
        console.error('Create expense error:', error);
      }
    });
  }

  private formatDateForApi(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }
}
