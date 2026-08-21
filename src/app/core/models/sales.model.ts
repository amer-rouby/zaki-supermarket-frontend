export interface SaleTransaction {
  id: number;
  storeId: number;
  userId: number;
  invoiceNumber: string;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  transactionDate: string;
  items: SaleItem[];
}

export type PaymentMethod = 'CASH' | 'VISA' | 'INSTAPAY' | 'WALLET' | 'CREDIT';

export interface SaleItem {
  id: number;
  transactionId: number;
  productId: number;
  productName?: string;
  batchId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleRequest {
  items: SaleItemRequest[];
  discountAmount?: number;
  paymentMethod?: string;
  customerPhone?: string;
  // Set only when syncing a sale that was queued while offline - lets the
  // server recognize a retried sync as the same sale instead of duplicating it.
  clientReferenceId?: string;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface DailySales {
  date: string;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  topProducts: ProductSale[];
}

export interface ProductSale {
  productId: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FilterState {
  period: PeriodType;
  startDate: string;
  endDate: string;
}

export interface StatCard {
  key: string;
  label: string;
  icon: string;
  class: string;
  showMargin?: boolean;
}

