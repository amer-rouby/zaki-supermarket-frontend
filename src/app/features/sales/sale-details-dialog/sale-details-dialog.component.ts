import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreSettingsService } from '../../../core/services/settings/store-settings.service';
import { StoreSettings } from '../../../core/models/settings/store-settings.model';
import { InvoicePrintService, PrintableSale } from '../../../core/services/invoice-print.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-sale-details-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule, TranslateModule],
  templateUrl: './sale-details-dialog.component.html',
  styleUrl: './sale-details-dialog.component.scss'
})
export class SaleDetailsDialogComponent {
  private readonly storeSettingsService = inject(StoreSettingsService);
  private readonly invoicePrintService = inject(InvoicePrintService);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);

  readonly storeSettings = signal<StoreSettings | null>(null);

  constructor(
    public dialogRef: MatDialogRef<SaleDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sale: any }
  ) {
    this.loadStoreSettings();
  }

  private loadStoreSettings(): void {
    this.storeSettingsService.getSettings().subscribe({
      next: (settings) => this.storeSettings.set(settings),
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'SETTINGS.LOAD_ERROR');
        this.storeSettings.set(this.getDefaultStoreInfo());
      }
    });
  }

  private getDefaultStoreInfo(): StoreSettings {
    return {
      id: 1,
      storeId: 1,
      storeName: this.translate.instant('STORE.DEFAULT_NAME'),
      address: '',
      phone: '',
      email: '',
      licenseNumber: '',
      taxNumber: '',
      commercialRegister: '',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h'
    };
  }

  formatDate(dateString: string): string {
    const lang = this.languageService.getCurrentLanguage();
    return new Date(dateString).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  getPaymentMethodLabel(method: string): string {
    if (!method) return '-';
    const key = `SALES.PAYMENT_METHOD.${method}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : method;
  }

  printInvoice(): void {
    try {
      const sale = this.data.sale;
      const store = this.storeSettings() || this.getDefaultStoreInfo();

      if (!sale) {
        this.errorHandler.showError('SALES.PRINT_ERROR');
        return;
      }

      const printableSale: PrintableSale = {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        transactionDate: sale.transactionDate,
        paymentMethod: sale.paymentMethod,
        totalAmount: sale.totalAmount,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        items: (sale.items || []).map((item: any) => ({
          id: item.id,
          productName: item.productName || item.product?.name || this.translate.instant('PRODUCTS.UNNAMED'),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      };

      this.invoicePrintService.printInvoice(printableSale, store);
      this.errorHandler.showSuccess('SALES.PRINT_SUCCESS');
    } catch (err) {
      this.errorHandler.showError('SALES.PRINT_ERROR');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
