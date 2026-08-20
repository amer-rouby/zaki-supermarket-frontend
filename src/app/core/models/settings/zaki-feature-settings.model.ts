export interface ZakiFeatureSettings {
  id: number;
  storeId: number;
  stockPredictionEnabled: boolean;
  reorderRecommendationsEnabled: boolean;
  pricingRecommendationsEnabled: boolean;
  supplierRecommendationsEnabled: boolean;
  dashboardInsightsEnabled: boolean;
  dailyBriefEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  realtimeUpdatesEnabled: boolean;
  voiceSearchEnabled: boolean;
  customerCreditEnabled: boolean;
  aiAssistantEnabled: boolean;
  eInvoiceEnabled: boolean;
  offlineModeEnabled: boolean;
  updatedAt?: string;
}

export type ZakiFeatureSettingsRequest = Partial<Omit<ZakiFeatureSettings, 'id' | 'storeId' | 'updatedAt'>>;
