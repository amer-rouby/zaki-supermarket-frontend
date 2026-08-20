export interface WhatsAppData {
  phoneNumber: string;
  encodedMessage: string;
  orderNumber?: string;
  whatsAppUrl?: string;
}

export interface WhatsAppRequest {
  orderId: number;
  supplierId: number;
}
