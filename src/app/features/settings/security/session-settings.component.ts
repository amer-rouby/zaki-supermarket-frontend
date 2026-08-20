import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { UserSettingsService } from '../../../core/services/settings/user-settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserSettings } from '../../../core/models/settings/user-settings.model';

@Component({
  selector: 'app-session-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, FormsModule],
  template: `
    <div class="session-settings-container">
      <div class="page-header-wrapper">
        <app-page-header
          [title]="translatedTitle"
          [subtitle]="translatedSubtitle">
        </app-page-header>
      </div>

      <mat-card>
        <mat-card-content>
          @if (loading()) {
            <div class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            <div class="settings-form">
              <div class="setting-item">
                <div class="setting-info">
                  <h3>{{ 'SETTINGS.SESSION.TIMEOUT_LABEL' | translate }}</h3>
                  <p>{{ 'SETTINGS.SESSION.TIMEOUT_DESC' | translate }}</p>
                </div>

                <div class="setting-control">
                  <mat-form-field appearance="outline" class="timeout-select">
                    <mat-label>{{ 'SETTINGS.SESSION.TIMEOUT_LABEL' | translate }}</mat-label>
                    <mat-select
                      [(ngModel)]="selectedTimeout"
                      (selectionChange)="onTimeoutChange($event.value)">
                      @for (timeout of allowedTimeouts; track timeout) {
                        <mat-option [value]="timeout">
                          {{ timeout }} {{ 'COMMON.MINUTES' | translate }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="setting-item">
                <div class="setting-info">
                  <h3>{{ 'SETTINGS.SESSION.CURRENT_SESSION' | translate }}</h3>
                  <p>{{ 'SETTINGS.SESSION.CURRENT_SESSION_DESC' | translate }}</p>
                </div>

                <div class="session-info">
                  <div class="info-row">
                    <span class="info-label">{{ 'SETTINGS.SESSION.EXPIRES_AT' | translate }}:</span>
                    <span class="info-value">{{ expiresAt }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ 'SETTINGS.SESSION.CURRENT_TIMEOUT' | translate }}:</span>
                    <span class="info-value">{{ currentTimeout }} {{ 'COMMON.MINUTES' | translate }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">{{ 'SETTINGS.SESSION.REMAINING_EXTENSIONS' | translate }}:</span>
                    <span class="info-value">{{ remainingExtensions }} {{ 'SETTINGS.SESSION.OF' | translate }} {{ maxExtensions }}</span>
                  </div>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="setting-item">
                <div class="setting-info">
                  <h3>{{ 'SETTINGS.SESSION.NOTE_TITLE' | translate }}</h3>
                  <p>{{ 'SETTINGS.SESSION.NOTE_DESC' | translate }}</p>
                </div>
              </div>
            </div>
          }
        </mat-card-content>

        @if (!loading()) {
          <mat-card-actions align="end">
            <button
              mat-raised-button
              color="primary"
              (click)="saveSettings()"
              [disabled]="saving() || selectedTimeout === currentTimeout">
              @if (saving()) {
                <mat-icon class="spin-icon">refresh</mat-icon>
              }
              {{ saving() ? ('COMMON.SAVING' | translate) : ('COMMON.SAVE' | translate) }}
            </button>
          </mat-card-actions>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .session-settings-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header-wrapper {
      margin-bottom: 24px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 0;
      gap: 24px;

      &:first-child {
        padding-top: 0;
      }
    }

    .setting-info {
      flex: 1;

      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--color-text-primary, #1a1a2e);
      }

      p {
        margin: 0;
        font-size: 14px;
        color: var(--color-text-secondary, #6b7280);
        line-height: 1.5;
      }
    }

    .setting-control {
      min-width: 200px;
    }

    .timeout-select {
      width: 100%;
    }

    .session-info {
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: var(--color-text-secondary, #6b7280);
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: var(--color-text-primary, #1a1a2e);
      font-weight: 500;
    }

    @media (max-width: 600px) {
      .setting-item {
        flex-direction: column;
      }

      .setting-control,
      .session-info {
        min-width: 100%;
      }
    }
  `]
})
export class SessionSettingsComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  translatedTitle: string = '';
  translatedSubtitle: string = '';

  allowedTimeouts: number[] = [15, 30, 60, 120, 240];
  selectedTimeout: number = 30;
  currentTimeout: number = 30;
  expiresAt: string = '';
  remainingExtensions: number = 0;
  maxExtensions: number = 3;

  ngOnInit(): void {
    this.translatedTitle = this.translate.instant('SETTINGS.SESSION.TITLE');
    this.translatedSubtitle = this.translate.instant('SETTINGS.SESSION.SUBTITLE');
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);

    this.userSettingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const settings = response.data as UserSettings;
          if (settings.allowedTimeouts && settings.allowedTimeouts.length > 0) {
            this.allowedTimeouts = settings.allowedTimeouts;
          }
          if (settings.sessionTimeout) {
            this.selectedTimeout = settings.sessionTimeout;
            this.currentTimeout = settings.sessionTimeout;
          }
        }
        this.loading.set(false);
        this.loadSessionInfo();
      },
      error: (err) => {
        this.loading.set(false);
        console.warn('Failed to load session settings, using defaults:', err);
        this.errorHandler.handleHttpError(err, 'SETTINGS.SESSION.LOAD_ERROR');
      }
    });
  }

  loadSessionInfo(): void {
    const expiresAt = this.authService.getExpiresAt();
    const sessionTimeout = this.authService.getSessionTimeout();

    if (expiresAt) {
      const date = new Date(expiresAt);
      this.expiresAt = date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      this.expiresAt = this.translate.instant('COMMON.NOT_AVAILABLE');
    }

    if (sessionTimeout !== null) {
      this.currentTimeout = sessionTimeout;
    }

    this.remainingExtensions = this.authService.getRemainingExtensions();
    this.maxExtensions = this.authService.getMaxExtensions();
  }

  onTimeoutChange(value: number): void {
    this.selectedTimeout = value;
  }

  saveSettings(): void {
    if (this.selectedTimeout === this.currentTimeout) {
      return;
    }

    this.saving.set(true);

    this.userSettingsService.updateSettings(this.selectedTimeout).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.currentTimeout = this.selectedTimeout;
          this.snackBar.open(
            this.translate.instant('SETTINGS.SESSION.SAVE_SUCCESS'),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 3000, panelClass: 'success-snackbar' }
          );
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorHandler.handleHttpError(err, 'SETTINGS.SESSION.SAVE_ERROR');
      }
    });
  }
}
