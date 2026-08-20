import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../shared/material.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationModel } from '../../core/models/Notification.model';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MaterialModule, PageHeaderComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  readonly notifications = signal<NotificationModel[]>([]);
  readonly unreadNotifications = signal<NotificationModel[]>([]);
  readonly loading = signal(false);
  readonly selectedTab = signal(0);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  // Tab 0 ("all") is real backend pagination; tab 1 ("unread") is its own
  // dedicated, unpaginated list - the two datasets aren't the same rows, so
  // pagination only makes sense (and is only shown) for the "all" tab.
  readonly filteredNotifications = computed(() => {
    return this.selectedTab() === 0 ? this.notifications() : this.unreadNotifications();
  });

  readonly hasPagination = computed(() => {
    return this.selectedTab() === 0 && this.totalElements() > this.pageSize();
  });

  readonly unreadBadgeCount = computed(() => this.unreadNotifications().length);

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);

    this.notificationService.getNotifications(this.pageIndex(), this.pageSize())
      .subscribe({
        next: (res) => {
          this.notifications.set(res.content || []);
          this.totalElements.set(res.totalElements || 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.notifications.set([]);
          this.errorHandler.handleHttpError(err, 'NOTIFICATIONS.LOAD_ERROR');
        }
      });
  }

  loadUnreadNotifications(): void {
    this.notificationService.getUnreadNotifications().subscribe({
      next: (list) => this.unreadNotifications.set(list),
      error: (err) => this.errorHandler.handleHttpError(err, 'NOTIFICATIONS.LOAD_ERROR')
    });
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onPageChange(event: any): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadNotifications();
  }

  markAsRead(id: number): void {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
    this.unreadNotifications.update(list => list.filter(n => n.id !== id));
    this.notificationService.markAsRead(id).subscribe({
      error: (err) => this.errorHandler.handleHttpError(err, 'NOTIFICATIONS.MARK_READ_ERROR')
    });
  }

  markAllAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.unreadNotifications.set([]);
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.errorHandler.showSuccess('NOTIFICATIONS.MARK_ALL_SUCCESS');
        this.loadNotifications();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'NOTIFICATIONS.MARK_ALL_ERROR')
    });
  }

  deleteNotification(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('NOTIFICATIONS.DELETE_CONFIRM_TITLE'),
        message: this.translate.instant('NOTIFICATIONS.DELETE_CONFIRM_MESSAGE'),
        confirmText: this.translate.instant('COMMON.YES'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.notificationService.deleteNotification(id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('NOTIFICATIONS.DELETE_SUCCESS');
            this.unreadNotifications.update(list => list.filter(n => n.id !== id));
            if (this.notifications().length === 1 && this.pageIndex() > 0) {
              this.pageIndex.update(v => v - 1);
            }
            this.loadNotifications();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'NOTIFICATIONS.DELETE_ERROR')
        });
      }
    });
  }

  getPriorityClass(priority: string) {
    const p = priority?.toUpperCase();
    if (p === 'URGENT') return 'urgent';
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  }

  getTypeIcon(type: string) { return this.notificationService.getTypeIcon(type); }
  getPriorityColor(priority: string) { return this.notificationService.getPriorityColor(priority); }
  getTypeLabel(type: string) { return this.notificationService.getTypeLabel(type); }
  formatDate(date: string) {
    return new Date(date).toLocaleString('ar-EG', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
