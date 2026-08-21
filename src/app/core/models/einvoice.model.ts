export type EInvoiceStatus = 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'ERROR';

export interface EInvoiceSubmission {
  id: number;
  saleTransactionId: number;
  status: EInvoiceStatus;
  etaUuid?: string;
  submittedAt?: string;
  errorMessage?: string;
  retryCount: number;
}
