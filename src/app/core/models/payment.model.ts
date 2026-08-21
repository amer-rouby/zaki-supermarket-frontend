export interface Payment {
  id?: number;
  storeId: number;
  referenceNumber: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface PaymentRequest {
  storeId: number;
  amount: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  expiryHours?: number;
}

export interface PaymentResponse {
  paymentId?: number;
  referenceNumber: string;
  paymentMethod: string;
  amount: number;
  status: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  paidAt?: string;
  createdAt?: string;
  message?: string;
}

export interface Refund {
  id?: number;
  paymentId: number;
  refundAmount: number;
  reason: string;
  status: RefundStatus;
  gatewayRefundId?: string;
  requestedBy?: number;
  approvedBy?: number;
  requestedAt?: string;
  approvedAt?: string;
  processedAt?: string;
}

export interface RefundRequest {
  paymentReference: string;
  amount: number;
  reason: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  VISA = 'VISA',
  INSTAPAY = 'INSTAPAY',
  FAWRY = 'FAWRY',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
}
