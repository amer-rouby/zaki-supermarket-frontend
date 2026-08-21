import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../shared/material.module';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { OfflineSalesQueueService, QueuedSale } from '../../../core/services/offline-sales-queue.service';

@Component({
  selector: 'app-offline-queue-dialog',
  standalone: true,
  imports: [MaterialModule, TranslateModule],
  templateUrl: './offline-queue-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './offline-queue-dialog.component.scss'
})
export class OfflineQueueDialogComponent {
  readonly dialogRef = inject(MatDialogRef<OfflineQueueDialogComponent>);
  readonly offlineQueueService = inject(OfflineSalesQueueService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);

  readonly isOnline = () => navigator.onLine;

  itemTotal(entry: QueuedSale): number {
    return entry.request.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      - (entry.request.discountAmount || 0);
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  formatDate(dateString: string): string {
    const lang = this.languageService.getCurrentLanguage();
    return new Date(dateString).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  syncNow(): void {
    this.offlineQueueService.syncAll();
  }

  discard(clientReferenceId: string): void {
    this.offlineQueueService.discard(clientReferenceId);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
