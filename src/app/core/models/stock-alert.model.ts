export interface StockAlert {
  id: number;
  productId: number;
  productName: string;
  batchNumber?: string;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  currentStock?: number;
  minStock?: number;
  expiryDate?: string;
  daysUntilExpiry?: number;
  createdAt: string;
}

export interface AlertStats {
  totalAlerts: number;
  unreadAlerts: number;
  lowStockAlerts: number;
  expiredAlerts: number;
  expiringSoonAlerts: number;
  outOfStockAlerts: number;
}
