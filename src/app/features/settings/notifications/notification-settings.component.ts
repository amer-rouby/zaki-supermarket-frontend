import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { NotificationSettingsService } from '../../../core/services/settings/notification-settings.service';

interface NotificationCategory {
  id: string;
  title: string;
  icon: string;
  settings: NotificationSetting[];
}

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
})
export class NotificationSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly notificationSettingsService = inject(NotificationSettingsService);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly notificationForm: FormGroup = this.fb.group({
    emailNotifications: [true],
    smsNotifications: [false],
    pushNotifications: [true],
    preferredLanguage: ['ar'],
    soundEnabled: [true],
    vibrationEnabled: [true],
    quietHours: this.fb.group({
      enabled: [false],
      startTime: ['22:00'],
      endTime: ['08:00']
    })
  });

  categories: NotificationCategory[] = [];

  ngOnInit(): void {
    this.loadNotificationSettings();
  }

  loadNotificationSettings(): void {
    this.loading.set(true);

    this.notificationSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.notificationForm.patchValue({
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
          pushNotifications: settings.pushNotifications,
          preferredLanguage: settings.preferredLanguage || 'ar',
          soundEnabled: settings.soundEnabled,
          vibrationEnabled: settings.vibrationEnabled,
          quietHours: {
            enabled: settings.quietHoursEnabled,
            startTime: settings.quietHoursStart || '22:00',
            endTime: settings.quietHoursEnd || '08:00'
          }
        });

        this.categories = [
          {
            id: 'inventory',
            title: 'NOTIFICATIONS.CATEGORIES.INVENTORY',
            icon: 'inventory_2',
            settings: [
              {
                key: 'notifyLowStock',
                label: 'NOTIFICATIONS.SETTINGS.LOW_STOCK',
                description: 'NOTIFICATIONS.DESC.LOW_STOCK',
                enabled: settings.notifyLowStock
              },
              {
                key: 'notifyOutOfStock',
                label: 'NOTIFICATIONS.SETTINGS.OUT_OF_STOCK',
                description: 'NOTIFICATIONS.DESC.OUT_OF_STOCK',
                enabled: settings.notifyOutOfStock
              },
              {
                key: 'notifyExpiryWarning',
                label: 'NOTIFICATIONS.SETTINGS.EXPIRY_WARNING',
                description: 'NOTIFICATIONS.DESC.EXPIRY_WARNING',
                enabled: settings.notifyExpiryWarning
              },
              {
                key: 'notifyExpiredProducts',
                label: 'NOTIFICATIONS.SETTINGS.EXPIRED_PRODUCTS',
                description: 'NOTIFICATIONS.DESC.EXPIRED_PRODUCTS',
                enabled: settings.notifyExpiredProducts
              }
            ]
          },
          {
            id: 'sales',
            title: 'NOTIFICATIONS.CATEGORIES.SALES',
            icon: 'shopping_cart',
            settings: [
              {
                key: 'notifyNewSale',
                label: 'NOTIFICATIONS.SETTINGS.NEW_SALE',
                description: 'NOTIFICATIONS.DESC.NEW_SALE',
                enabled: settings.notifyNewSale
              },
              {
                key: 'notifyLargeSale',
                label: 'NOTIFICATIONS.SETTINGS.LARGE_SALE',
                description: 'NOTIFICATIONS.DESC.LARGE_SALE',
                enabled: settings.notifyLargeSale
              }
            ]
          },
          {
            id: 'expenses',
            title: 'NOTIFICATIONS.CATEGORIES.EXPENSES',
            icon: 'payments',
            settings: [
              {
                key: 'notifyNewExpense',
                label: 'NOTIFICATIONS.SETTINGS.NEW_EXPENSE',
                description: 'NOTIFICATIONS.DESC.NEW_EXPENSE',
                enabled: settings.notifyNewExpense
              },
              {
                key: 'notifyLargeExpense',
                label: 'NOTIFICATIONS.SETTINGS.LARGE_EXPENSE',
                description: 'NOTIFICATIONS.DESC.LARGE_EXPENSE',
                enabled: settings.notifyLargeExpense
              }
            ]
          },
          {
            id: 'system',
            title: 'NOTIFICATIONS.CATEGORIES.SYSTEM',
            icon: 'settings',
            settings: [
              {
                key: 'notifyBackupReminder',
                label: 'NOTIFICATIONS.SETTINGS.BACKUP_REMINDER',
                description: 'NOTIFICATIONS.DESC.BACKUP_REMINDER',
                enabled: settings.notifyBackupReminder
              },
              {
                key: 'notifySecurityAlerts',
                label: 'NOTIFICATIONS.SETTINGS.SECURITY_ALERTS',
                description: 'NOTIFICATIONS.DESC.SECURITY_ALERTS',
                enabled: settings.notifySecurityAlerts
              }
            ]
          }
        ];

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'NOTIFICATIONS.LOAD_ERROR');
      }
    });
  }

  toggleAllSettings(category: NotificationCategory): void {
    const allEnabled = category.settings.every(setting => setting.enabled);
    category.settings.forEach(setting => {
      setting.enabled = !allEnabled;
    });
  }

  areAllSettingsEnabled(category: NotificationCategory): boolean {
    return category.settings.every(setting => setting.enabled);
  }

  getToggleAllIcon(category: NotificationCategory): string {
    return this.areAllSettingsEnabled(category) ? 'check_box' : 'check_box_outline_blank';
  }

  onSave(): void {
    if (this.notificationForm.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.saving.set(true);

    const formValue = this.notificationForm.value;

    const request = {
      emailNotifications: formValue.emailNotifications,
      smsNotifications: formValue.smsNotifications,
      pushNotifications: formValue.pushNotifications,
      preferredLanguage: formValue.preferredLanguage,
      soundEnabled: formValue.soundEnabled,
      vibrationEnabled: formValue.vibrationEnabled,
      quietHoursEnabled: formValue.quietHours?.enabled,
      quietHoursStart: formValue.quietHours?.startTime,
      quietHoursEnd: formValue.quietHours?.endTime,
      ...this.categories.reduce((acc, category) => {
        category.settings.forEach(setting => {
          acc[setting.key] = setting.enabled;
        });
        return acc;
      }, {} as Record<string, boolean>)
    };

    this.notificationSettingsService.updateSettings(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.errorHandler.showSuccess('SETTINGS.SAVE_SUCCESS');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorHandler.handleHttpError(err, 'SETTINGS.SAVE_ERROR');
      }
    });
  }

  onReset(): void {
    this.loadNotificationSettings();
    this.errorHandler.showSuccess('COMMON.RESET');
  }
}
