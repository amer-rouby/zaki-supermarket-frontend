export interface StockMovement {
  id: number;
  batchId: number;
  productName: string;
  batchNumber: string;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'EXPIRED' | 'DISCARDED';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitPrice?: number;
  totalValue?: number;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
  movementDate: string;
  userId: number;
  userName: string;
  storeId: number;
}

export interface StockMovementStats {
  totalMovements: number;
  totalStockIn: number;
  totalStockOut: number;
  totalAdjustments: number;
  totalExpired: number;
  totalTransferred: number;
}

export interface CreateMovementRequest {
  batchId: number;
  movementType: string;
  quantity: number;
  unitPrice?: number;
  referenceNumber?: string;
  reason?: string;
  notes?: string;
}
