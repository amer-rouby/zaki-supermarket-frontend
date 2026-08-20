export interface NotificationModel {
  id: number;
  title: string;
  message: string;
  titleEn?: string;
  messageEn?: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRY_WARNING' | 'EXPIRED' | 'SALE_COMPLETED' | 'LARGE_SALE'
    | 'EXPENSE_ADDED' | 'LARGE_EXPENSE' | 'BACKUP_REMINDER' | 'SECURITY_ALERT' | 'SYSTEM';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  read: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  icon?: string;
  time?: string;
  link?: string;
  typeLabelAr?: string;
  priorityLabelAr?: string;
  iconName?: string;
  priorityColor?: string;

}
export interface NotificationsResponse {
  content: NotificationModel[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  unreadCount?: number;
}
