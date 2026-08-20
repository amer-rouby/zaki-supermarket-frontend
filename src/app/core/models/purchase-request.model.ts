export interface PurchaseOrderRequest {
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  priority?: string;
  paymentTerms?: string;
  notes?: string;
  sourceType?: string;
  sourceId?: number;
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface SupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  status?: string;
  notes?: string;
}
