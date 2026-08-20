import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { SessionWarningData } from '../../../core/models/session-status.model';

@Component({
  selector: 'app-session-warning-dialog',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <div class="warning-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon" color="warn">timer</mat-icon>
        <h2 mat-dialog-title>{{ 'SESSION_WARNING.TITLE' | translate }}</h2>
      </div>

      <mat-dialog-content>
        <p class="warning-message">
          {{ 'SESSION_WARNING.MESSAGE' | translate : { time: remainingTimeText } }}
        </p>

        <div class="extensions-info" *ngIf="data.canExtend">
          <mat-icon>autorenew</mat-icon>
          <span>
            {{ 'SESSION_WARNING.REMAINING_EXTENSIONS' | translate : { count: data.remainingExtensions } }}
          </span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onLogout()" class="logout-btn">
          <mat-icon>logout</mat-icon>
          {{ 'SESSION_WARNING.LOGOUT' | translate }}
        </button>

        <button
          mat-raised-button
          color="primary"
          (click)="onExtend()"
          [disabled]="!data.canExtend"
          class="extend-btn">
          <mat-icon>refresh</mat-icon>
          {{ 'SESSION_WARNING.EXTEND' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .warning-dialog {
      padding: 8px;
      text-align: center;
    }

    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a2e);
      }
    }

    .warning-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .warning-message {
      font-size: 16px;
      color: var(--color-text-secondary, #6b7280);
      line-height: 1.6;
      margin: 16px 0;
    }

    .extensions-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: var(--background-hover, #f3f4f6);
      border-radius: 8px;
      margin: 16px 0;
      font-size: 14px;
      color: var(--color-text-primary, #1a1a2e);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--primary, #1976d2);
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 0 8px;
      gap: 12px;
    }

    .logout-btn {
      flex: 1;
      mat-icon {
        margin-inline-end: 4px;
      }
    }

    .extend-btn {
      flex: 1;
      mat-icon {
        margin-inline-end: 4px;
      }
    }
  `]
})
export class SessionWarningDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<SessionWarningDialogComponent>);
  readonly data: SessionWarningData = inject(MAT_DIALOG_DATA);
  remainingTimeText = '00:00';
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateRemainingTime();
    this.countdownIntervalId = setInterval(() => this.updateRemainingTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
  }

  onExtend(): void {
    this.dialogRef.close(true);
  }

  onLogout(): void {
    this.dialogRef.close(false);
  }

  private updateRemainingTime(): void {
    const expiresAtMs = this.data.expiresAt
      ? new Date(this.data.expiresAt).getTime()
      : Date.now() + (this.data.remainingMinutes * 60 * 1000);

    const remainingSeconds = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    this.remainingTimeText = `${this.padTimePart(minutes)}:${this.padTimePart(seconds)}`;

    if (remainingSeconds <= 0) {
      this.dialogRef.close(false);
    }
  }

  private padTimePart(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
