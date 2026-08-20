export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  storeId: number;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  priority: PurchaseOrderPriority;
  paymentTerms?: string;
  notes?: string;
  sourceType?: string;
  sourceId?: number;
  createdById?: number;
  createdByFullName?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type PurchaseOrderPriority =
  | 'LOW'
  | 'NORMAL'
  | 'URGENT';

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  fullyReceived: boolean;
  pendingQuantity: number;
}

export interface PurchaseOrderStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  received: number;
}

export interface SendEmailResponse {
  success: boolean;
  recipientEmail: string;
  message: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  status: SupplierStatus;
  notes?: string;
  storeId: number;
  createdAt: string;
  updatedAt: string;
}

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
