import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../shared/material.module';
import { ExpenseService } from '../../core/services/expense.service';
import { AddExpenseDialogComponent } from './add-expense-dialog/add-expense-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { CurrencyService } from '../../core/services/currency.service';

interface ExpenseRow {
  id: number;
  category: string;
  categoryAr: string;
  title: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  referenceNumber: string;
  createdAt: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MaterialModule,
    PageHeaderComponent
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly currencyService = inject(CurrencyService);

  readonly expenses = signal<ExpenseRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly totalExpenses = signal<number>(0);

  readonly displayedColumns = ['category', 'title', 'amount', 'expenseDate', 'paymentMethod', 'actions'];

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading.set(true);
    this.error.set('');

    this.expenseService.getExpenses(0, 50).subscribe({
      next: (data) => {
        const expenseRows: ExpenseRow[] = (data.content || data).map((expense: any) => ({
          id: expense.id,
          category: expense.category,
          categoryAr: expense.categoryArabic || expense.category,
          title: expense.title,
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          paymentMethod: expense.paymentMethod || '-',
          referenceNumber: expense.referenceNumber || '-',
          createdAt: expense.createdAt
        }));

        this.expenses.set(expenseRows);
        this.totalExpenses.set(expenseRows.reduce((sum, exp) => sum + exp.amount, 0));
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load expenses');
        this.loading.set(false);
        this.errorHandler.handleHttpError(error, 'EXPENSES.LOAD_ERROR');
      }
    });
  }

  openAddExpenseDialog(): void {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses();
      }
    });
  }

  deleteExpense(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('EXPENSES.DELETE_CONFIRM_TITLE'),
        message: this.translate.instant('EXPENSES.DELETE_CONFIRM_MESSAGE'),
        confirmText: this.translate.instant('EXPENSES.DELETE_CONFIRM_YES'),
        cancelText: this.translate.instant('EXPENSES.DELETE_CONFIRM_NO')
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.expenseService.deleteExpense(id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('EXPENSES.DELETE_SUCCESS');
            this.loadExpenses();
          },
          error: (error) => {
            this.errorHandler.handleHttpError(error, 'EXPENSES.DELETE_ERROR');
          }
        });
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, 'ar');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
