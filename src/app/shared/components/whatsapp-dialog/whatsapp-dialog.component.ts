import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

export interface WhatsAppDialogData {
  orderId: number;
  orderNumber: string;
  supplierName: string;
}

@Component({
  selector: 'app-whatsapp-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './whatsapp-dialog.component.html',
  styleUrl: './whatsapp-dialog.component.scss'
})
export class WhatsAppDialogComponent {
  private readonly whatsAppService = inject(WhatsAppService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly loading = signal(false);
  readonly decodedMessage = signal<string>('');
  readonly phoneNumber = signal<string>('');
  readonly rawUrl = signal<string>('');
  readonly desktopUrl = signal<string>('');
  readonly safeUrl = signal<SafeUrl | null>(null);
  readonly opened = signal(false);
  readonly desktopOpened = signal(false);

  constructor(
    public dialogRef: MatDialogRef<WhatsAppDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WhatsAppDialogData
  ) {
    this.loadWhatsAppData();
  }

  private loadWhatsAppData(): void {
    this.loading.set(true);

    this.whatsAppService.getWhatsappData(this.data.orderId).subscribe({
      next: (response) => {
        if (!response || !response.phoneNumber) {
          this.loading.set(false);
          return;
        }

        this.phoneNumber.set(response.phoneNumber);

        if (response.encodedMessage && response.encodedMessage.trim() !== '') {
          try {
            const decoded = decodeURIComponent(response.encodedMessage);
            this.decodedMessage.set(decoded);
          } catch {
            this.decodedMessage.set(response.encodedMessage);
          }
        } else {
          this.decodedMessage.set('');
        }

        const webUrl = response.whatsAppUrl || this.whatsAppService.buildWhatsAppLink(response);
        this.rawUrl.set(webUrl);
        this.safeUrl.set(this.sanitizer.bypassSecurityTrustUrl(webUrl));

        const phone = (response.phoneNumber || '').replace(/^\+/, '');
        const message = response.encodedMessage || '';
        this.desktopUrl.set(`whatsapp://send?phone=${phone}&text=${message}`);

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'PURCHASES.WHATSAPP_LOAD_ERROR');
      }
    });
  }

  onOpenDesktop(): void {
    const url = this.desktopUrl();
    if (!url) return;
    this.desktopOpened.set(true);
    window.location.href = url;
    setTimeout(() => this.dialogRef.close(true), 2000);
  }

  onOpenWeb(): void {
    const url = this.rawUrl();
    if (!url) return;
    this.opened.set(true);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => this.dialogRef.close(true), 2000);
  }

  onRetry(): void {
    this.loadWhatsAppData();
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
