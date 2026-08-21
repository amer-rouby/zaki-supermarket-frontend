export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  status: CustomerStatus;
  notes?: string;
  storeId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  status?: CustomerStatus;
  notes?: string;
}

export interface CustomerPaymentRequest {
  amount: number;
  notes?: string;
}

export type CustomerTransactionType = 'CREDIT_SALE' | 'PAYMENT';

export interface CustomerTransaction {
  id: number;
  type: CustomerTransactionType;
  amount: number;
  relatedSaleId?: number;
  balanceAfter: number;
  createdByName?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerStatement {
  customer: Customer;
  transactions: CustomerTransaction[];
}
