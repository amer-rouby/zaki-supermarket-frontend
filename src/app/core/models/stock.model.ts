export interface StockBatch {
  id: number;
  productId: number;
  productName?: string;
  batchNumber: string;
  quantityCurrent: number;
  quantityInitial: number;
  expiryDate: string;
  productionDate?: string;
  location?: string;
  shelf?: string;
  warehouse?: string;
  notes?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DISCARDED' | 'GOOD' | 'LOW' | 'EXPIRING_SOON';
  createdAt?: string;
  updatedAt?: string;
  storeId?: number;
  buyPrice?: number;
  sellPrice?: number;
  version?: number;
}

export interface StockBatchResponse {
  content: StockBatch[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
}

export interface StockAdjustmentHistory {
  id: number;
  batchId: number;
  batchNumber?: string;
  productName?: string;
  type: 'ADD' | 'REMOVE' | 'CORRECTION';
  quantity: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'RETURNED' | 'COUNT_ERROR' | 'OTHER';
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  adjustmentDate: string;
  adjustedBy?: number;
  adjustedByName?: string;
}

export interface StockAdjustment {
  batchId: number;
  type: 'ADD' | 'REMOVE' | 'CORRECTION';
  quantity: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'RETURNED' | 'COUNT_ERROR' | 'OTHER';
  notes?: string;
  adjustmentDate?: string;
}
