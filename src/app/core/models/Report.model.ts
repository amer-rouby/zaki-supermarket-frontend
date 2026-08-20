export interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  totalItems: number;
  revenueByPaymentMethod: Record<string, number>;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
}

export interface StockReportData {
  totalStockValue: number;
  totalItems: number;
  lowStockItems: number;
  expiredItems: number;
  expiringSoonItems: number;
  stockByCategory: Array<{
    categoryName: string;
    itemCount: number;
    totalValue: number;
  }>;
  lowStockProducts: Array<{
    productId: number;
    productName: string;
    batchNumber: string;
    currentStock: number;
    minStock: number;
    expiryDate?: string;
  }>;
  expiringProducts: Array<{
    productId: number;
    productName: string;
    batchNumber: string;
    currentStock: number;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;
}

export interface ExpiryReportData {
  totalExpiring: number;
  urgentExpiring: number;
  warningExpiring: number;
  okExpiring: number;
  expiringProducts: Array<{
    productId: number;
    productName: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    currentStock: number;
    status: 'URGENT' | 'WARNING' | 'OK';
    estimatedValue: number;
  }>;
}

export interface ReportRequest {
  storeId: number;
  startDate?: string;
  endDate?: string;
  reportType?: 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
}


export interface ExpiryData {
  totalExpiring: number;
  urgentExpiring: number;
  warningExpiring: number;
  okExpiring: number;
  expiringProducts: Array<{
    productId: number;
    productName: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    currentStock: number;
    status: 'URGENT' | 'WARNING' | 'OK';
    estimatedValue: number;
  }>;
}


export interface DailySalesRow {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductRow {
  rank: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}


export interface StockCategoryRow {
  categoryName: string;
  itemCount: number;
  totalValue: number;
}

export interface LowStockRow {
  productId: number;
  productName: string;
  batchNumber: string;
  currentStock: number;
  minStock: number;
  expiryDate?: string;
  progress: number;
}

export interface ExpiringRow {
  productId: number;
  productName: string;
  batchNumber: string;
  currentStock: number;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'urgent' | 'warning' | 'ok';
}

