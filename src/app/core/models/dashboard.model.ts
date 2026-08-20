export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayAverageOrder: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryValue: number;
  expiringBatches: number;
  expiredBatches: number;
  topProducts: TopProduct[];
  recentSales: RecentSale[];
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}
export interface RecentSale {
  saleId: number;
  invoiceNumber: string;
  totalAmount: number;
  transactionDate: string;
  paymentMethod: string;
}
export type { ApiResponse } from './api-response.model';

export interface SaleSummary {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  transactionDate: string;
  customerPhone?: string;
}

export interface TodaySalesResponse {
  totalAmount: number;
  count: number;
  sales: SaleSummary[];
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentSales: SaleSummary[];
  revenueChart?: ChartPoint[];
}

export interface ChartPoint {
  date: string;
  revenue: number;
  orders: number;
}
