export interface StoreSettings {
  id: number;
  storeId: number;
  storeName: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  taxNumber?: string;
  commercialRegister?: string;
  logoUrl?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  enabledPaymentMethods?: string;
  largeSaleThreshold?: number;
  largeExpenseThreshold?: number;
  updatedAt?: string;
}

export interface StoreSettingsRequest {
  storeName: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  taxNumber?: string;
  commercialRegister?: string;
  logoUrl?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  enabledPaymentMethods?: string;
  largeSaleThreshold?: number;
  largeExpenseThreshold?: number;
}
