export type AnomalyType =
  | 'EXCESSIVE_RETURNS'
  | 'UNUSUAL_DISCOUNT'
  | 'FREQUENT_CANCELLATIONS'
  | 'REPEATED_STOCK_ADJUSTMENTS'
  | 'LARGE_STOCK_DISCREPANCY';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnomalyStatus = 'NEW' | 'REVIEWED' | 'DISMISSED';

export interface Anomaly {
  id: number;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  relatedEntityName?: string;
  detectedAt: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

export interface AnomalyPage {
  content: Anomaly[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AnomalyCounts {
  NEW: number;
  REVIEWED: number;
  DISMISSED: number;
}
