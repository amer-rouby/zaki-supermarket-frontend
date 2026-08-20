export interface Expense {
  id?: number;
  storeId: number;
  category: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  attachmentUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'PURCHASES'
  | 'SALARIES'
  | 'RENT'
  | 'UTILITIES'
  | 'MAINTENANCE'
  | 'MARKETING'
  | 'INSURANCE'
  | 'LICENSES'
  | 'TRANSPORT'
  | 'OTHER';

export interface ExpenseSummary {
  totalExpenses: number;
  totalTransactions: number;
  averageExpense: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  dailyExpenses: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  recentExpenses: Array<{
    id: number;
    title: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: string;
  }>;
}
