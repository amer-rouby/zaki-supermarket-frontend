import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

export interface ConfirmDialogOptions {
  titleKey?: string;
  messageKey: string;
  messageParams?: Record<string, unknown>;
  confirmKey?: string;
  cancelKey?: string;
  color?: 'primary' | 'accent' | 'warn';
  width?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  open(options: ConfirmDialogOptions): Observable<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: options.width ?? '400px',
      data: {
        title: this.translate.instant(options.titleKey ?? 'COMMON.CONFIRM'),
        message: this.translate.instant(options.messageKey, options.messageParams),
        confirmText: this.translate.instant(options.confirmKey ?? 'COMMON.YES'),
        cancelText: this.translate.instant(options.cancelKey ?? 'COMMON.CANCEL'),
        color: options.color ?? 'warn'
      }
    });
    return ref.afterClosed();
  }

  confirmDelete(messageKey: string, messageParams?: Record<string, unknown>): Observable<boolean> {
    return this.open({ messageKey, messageParams, color: 'warn' });
  }
}
