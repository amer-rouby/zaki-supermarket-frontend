import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationModel } from '../../../core/models/Notification.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly notifications = input<NotificationModel[]>([]);
  readonly unreadCount = input<number>(0);

  readonly onRefreshRequired = output<void>();
  readonly notificationClick = output<NotificationModel>();
  readonly viewAll = output<void>();

  getPriorityClass(priority: string): string {
    const p = priority?.toUpperCase();
    switch (p) {
      case 'URGENT': return 'urgent';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      default: return 'low';
    }
  }

  getPriorityLabel(priority: string): string {
    return this.translate.instant(`NOTIFICATIONS.PRIORITY.${priority?.toUpperCase()}`);
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.onRefreshRequired.emit()
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.onRefreshRequired.emit()
    });
  }

  onDelete(id: number) {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => this.onRefreshRequired.emit()
    });
  }

  onNotificationClick(n: NotificationModel) {
    if (!n.read) {
      this.markAsRead(n.id);
    }
    this.notificationClick.emit(n);
  }

  formatTime(date: string): string {
    return (this.notificationService as any).formatTime(date);
  }

  viewAllNotifications() {
    this.viewAll.emit();
  }
}
