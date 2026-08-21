import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, map, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { LanguageService } from './language.service';
import { environment } from '../../../environments/environment';
import { NotificationModel, NotificationsResponse } from '../models/Notification.model';

export interface NotificationStreamEvent {
  type: 'notification-created' | 'notifications-changed' | 'connected' | 'stock-changed';
  notification?: NotificationModel;
}

export interface StockChangedEvent {
  changeType: 'CREATED' | 'UPDATED' | 'DELETED' | 'ADJUSTED';
  batch: {
    id: number;
    productId: number;
    productName: string;
    quantityCurrent: number;
    status: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // Broadcasts real-time stock-batch changes pushed over the existing SSE
  // connection, so screens can patch their data in place instead of each
  // opening their own EventSource to the same endpoint.
  readonly stockChanged$ = new Subject<StockChangedEvent>();

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private getCommonParams(): HttpParams {
    return new HttpParams().set('storeId', this.authService.getStoreId() || 1);
  }

  public getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'LOW_STOCK': 'inventory_2',
      'OUT_OF_STOCK': 'remove_shopping_cart',
      'EXPIRY_WARNING': 'warning',
      'EXPIRED': 'error',
      'SALE_COMPLETED': 'check_circle',
      'LARGE_SALE': 'check_circle',
      'EXPENSE_ADDED': 'receipt_long',
      'LARGE_EXPENSE': 'receipt_long',
      'BACKUP_REMINDER': 'backup',
      'SECURITY_ALERT': 'gpp_maybe',
      'SYSTEM': 'info'
    };
    return icons[type] || 'notifications';
  }

  public getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'URGENT': '#dc2626',
      'HIGH': '#f59e0b',
      'MEDIUM': '#3b82f6',
      'LOW': '#6b7280'
    };
    return colors[priority] || '#6b7280';
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const isEn = this.languageService.getCurrentLanguage() === 'en';
    if (isEn) {
      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US');
    }
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG');
  }

  private mapNotification(n: any): NotificationModel {
    const isEn = this.languageService.getCurrentLanguage() === 'en';
    return {
      id: n.id,
      title: (isEn && n.titleEn) ? n.titleEn : n.title,
      message: (isEn && n.messageEn) ? n.messageEn : n.message,
      titleEn: n.titleEn,
      messageEn: n.messageEn,
      type: n.type,
      priority: n.priority,
      read: n.read,
      createdAt: n.createdAt,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      icon: this.getTypeIcon(n.type),
      time: this.formatTime(n.createdAt),
      link: this.getNotificationLink(n.relatedEntityType, n.relatedEntityId)
    };
  }

  private getNotificationLink(entityType?: string, entityId?: number): string | undefined {
    if (!entityType || !entityId) return undefined;

    const links: Record<string, string> = {
      'PRODUCT': `/products/${entityId}`,
      'STOCK_BATCH': `/stock/batches/${entityId}`,
      'SALE': `/sales/${entityId}`,
      'EXPENSE': `/expenses/${entityId}`
    };
    return links[entityType];
  }

  getNotifications(page: number = 0, size: number = 20): Observable<NotificationsResponse> {
    const params = this.getCommonParams().set('page', page).set('size', size);

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params }).pipe(
      map(response => {
        const content = (response.data?.content || []).map((n: any) => this.mapNotification(n));
        const unreadCount = content.filter((n: NotificationModel) => !n.read).length;
        return {
          ...response.data,
          content,
          unreadCount
        };
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return throwError(() => error);
      })
    );
  }

  connectToNotificationStream(): Observable<NotificationStreamEvent> {
    return new Observable<NotificationStreamEvent>((observer) => {
      const token = this.authService.getToken();
      const storeId = this.authService.getStoreId();

      if (!token || !storeId) {
        observer.complete();
        return undefined;
      }

      const streamUrl = `${this.apiUrl}/stream?storeId=${storeId}&token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('connected', () => {
        observer.next({ type: 'connected' });
      });

      eventSource.addEventListener('notification-created', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        observer.next({
          type: 'notification-created',
          notification: this.mapNotification(data)
        });
      });

      eventSource.addEventListener('notifications-changed', () => {
        observer.next({ type: 'notifications-changed' });
      });

      eventSource.addEventListener('stock-changed', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        this.stockChanged$.next(data);
        observer.next({ type: 'stock-changed' });
      });

      eventSource.onerror = (error) => {
        console.error('Notification stream error:', error);
      };

      return () => eventSource.close();
    });
  }

  getUnreadNotifications(): Observable<NotificationModel[]> {
    const params = this.getCommonParams().set('unread', 'true');
    return this.http.get<any>(`${this.apiUrl}/unread`, { headers: this.getAuthHeaders(), params }).pipe(
      map(response => (response.data || []).map((n: any) => this.mapNotification(n))),
      catchError(error => {
        console.error('Error fetching unread notifications:', error);
        return throwError(() => error);
      })
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`, {
      headers: this.getAuthHeaders(),
      params: this.getCommonParams()
    }).pipe(
      map(response => response.data || 0),
      catchError(error => {
        console.error('Error fetching unread count:', error);
        return throwError(() => error);
      })
    );
  }

  markAsRead(notificationId: number): Observable<NotificationModel> {
    return this.http.put<any>(`${this.apiUrl}/${notificationId}/read`, {}, {
      headers: this.getAuthHeaders(),
      params: this.getCommonParams()
    }).pipe(
      map(response => this.mapNotification(response.data)),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return throwError(() => error);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {}, {
      headers: this.getAuthHeaders(),
      params: this.getCommonParams()
    }).pipe(
      catchError(error => {
        console.error('Error marking all notifications as read:', error);
        return throwError(() => error);
      })
    );
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`, {
      headers: this.getAuthHeaders(),
      params: this.getCommonParams()
    }).pipe(
      catchError(error => {
        console.error('Error deleting notification:', error);
        return throwError(() => error);
      })
    );
  }

  createNotification(notification: {
    title: string;
    message: string;
    type: string;
    priority?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }): Observable<NotificationModel> {
    return this.http.post<any>(this.apiUrl, {
      ...notification,
      storeId: this.authService.getStoreId()
    }, { headers: this.getAuthHeaders() }).pipe(
      map(response => this.mapNotification(response.data)),
      catchError(error => {
        console.error('Error creating notification:', error);
        return throwError(() => error);
      })
    );
  }

  checkAndCreateAlerts(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/check-alerts`, null, {
      headers: this.getAuthHeaders(),
      params: this.getCommonParams()
    }).pipe(
      catchError(error => {
        console.error('Error checking alerts:', error);
        return throwError(() => error);
      })
    );
  }

  public getTypeLabel(type: string): string {
    if (this.languageService.getCurrentLanguage() === 'en') {
      const labelsEn: Record<string, string> = {
        'LOW_STOCK': 'Low Stock',
        'OUT_OF_STOCK': 'Out of Stock',
        'EXPIRY_WARNING': 'Expiring Soon',
        'EXPIRED': 'Expired',
        'SALE_COMPLETED': 'Sale Completed',
        'LARGE_SALE': 'Large Sale',
        'EXPENSE_ADDED': 'Expense Added',
        'LARGE_EXPENSE': 'Large Expense',
        'BACKUP_REMINDER': 'Backup Reminder',
        'SECURITY_ALERT': 'Security Alert',
        'SYSTEM': 'System'
      };
      return labelsEn[type] || type;
    }
    const labels: Record<string, string> = {
      'LOW_STOCK': 'مخزون منخفض',
      'OUT_OF_STOCK': 'نفاد المخزون',
      'EXPIRY_WARNING': 'صلاحية قريبة',
      'EXPIRED': 'منتهية الصلاحية',
      'SALE_COMPLETED': 'تمت عملية بيع',
      'LARGE_SALE': 'عملية بيع كبيرة',
      'EXPENSE_ADDED': 'تم إضافة مصروف',
      'LARGE_EXPENSE': 'مصروف كبير',
      'BACKUP_REMINDER': 'تذكير بالنسخ الاحتياطي',
      'SECURITY_ALERT': 'تنبيه أمني',
      'SYSTEM': 'نظام'
    };
    return labels[type] || type;
  }

}
