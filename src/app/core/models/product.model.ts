export interface Product {
  id: number;
  storeId: number;
  name: string;
  barcode?: string;
  category?: string;
  unitType: string;
  minStockLevel: number;
  totalStock: number;
  sellPrice: number;
  buyPrice?: number;
  extraAttributes?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductRequest {
  name: string;
  barcode?: string;
  category?: string;
  unitType?: string;
  minStockLevel?: number;
  sellPrice: number;
  buyPrice?: number;
  extraAttributes?: Record<string, any>;
  initialStock?: number;
  expiryDate?: string | Date;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ProductsCountResponse {
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}
