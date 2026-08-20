export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface AnalyticsApiRaw {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  totalItems: number;
  profit?: number;
  profitMargin?: number;
  revenueByPaymentMethod: Record<string, number>;
  ordersByDay: Record<string, number>;
  topProducts?: ProductApiRaw[];
  dailySales: any[] | null;
}

export interface ProductApiRaw {
  productId: number;
  productName: string;
  totalQuantity?: number;
  quantitySold?: number;
  totalRevenue: number;
}

export interface CategoryApiRaw {
  dateRange: { start: string; end: string; };
  salesByCategory: Record<string, number>;
  totalCategories: number;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  totalItems: number;
  profit: number;
  profitMargin: number;
  paymentMethods: PaymentMethodStats[];
  salesTrend: SalesTrend[];
  dailyComparison: DailyComparison[];
  trendData?: SalesTrend[];
}

export interface SalesTrend {
  date: string;
  revenue: number;
  sales: number;
  label?: string;
  value?: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface DailyComparison {
  day: string;
  revenue: number;
  sales: number;
}

export interface ProductSales {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface CategorySales {
  categoryId: number;
  categoryName: string;
  revenue: number;
  sales: number;
}

export interface SalesAnalyticsParams {
  storeId: number;
  startDate: string;
  endDate: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface SaleRequest {
  storeId: number;
  items: SaleItemRequest[];
  customerPhone?: string;
  paymentMethod: string;
  discountAmount: number;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface SaleResponse {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  customerPhone?: string;
  transactionDate: string;
  items: SaleItemResponse[];
}

export interface SaleItemResponse {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleSearchResult {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  transactionDate: string;
  customerPhone?: string;
  itemsCount: number;
}

export interface TodaySalesResponse {
  totalAmount: number;
  count: number;
  sales?: any[];
}
