import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { StoreSettings } from '../models/settings/store-settings.model';
import { getPrintDocumentStyles, getPrintFooterHtml, getPrintLetterheadHtml } from './print-document.util';

export interface PrintableSale {
  id: number;
  invoiceNumber: string;
  transactionDate: string;
  paymentMethod: string;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  items: PrintableSaleItem[];
}

export interface PrintableSaleItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoicePrintService {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  /**
   * Opens a print-ready invoice in a hidden iframe using srcdoc.
   * The iframe will auto-trigger the browser's print dialog after loading.
   * No new window or tab will be opened.
   */
  printInvoice(sale: PrintableSale, store: StoreSettings): void {
    const html = this.generateInvoiceHtml(sale, store);

    // Remove existing iframe if present
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create new iframe with srcdoc
    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.opacity = '0';
    iframe.setAttribute('srcdoc', html);

    document.body.appendChild(iframe);

    // Flag to ensure print only happens once
    let hasPrinted = false;

    // Trigger print when iframe loads
    const triggerPrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;

      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (error) {
          console.error('Print failed:', error);
        }
        // Clean up: remove iframe after printing
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.remove();
          }
        }, 500);
      }, 300);
    };

    iframe.onload = triggerPrint;

    // Fallback timeout in case onload doesn't fire
    setTimeout(triggerPrint, 800);
  }

  private generateInvoiceHtml(sale: PrintableSale, store: StoreSettings): string {
    const isArabic = this.languageService.getCurrentLanguage() === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';
    const lang = isArabic ? 'ar' : 'en';

    // Force immediate translation resolution
    const t = (key: string): string => {
      const val = this.translate.instant(key);
      return val && val !== key ? val : key;
    };

    const storeMeta = [
      store.taxNumber ? `${t('SETTINGS.TAX_NUMBER')}: ${store.taxNumber}` : '',
      t('SALES.INVOICE_NUMBER') + ': ' + sale.invoiceNumber
    ].filter(Boolean).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;');

    return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t('SALES.INVOICE_NUMBER')} #${sale.invoiceNumber}</title>
${this.getPrintStyles(isArabic)}
</head>
<body>
  <div class="print-doc">
    ${getPrintLetterheadHtml(
      { name: store.storeName || t('APP.NAME'), address: store.address, phone: store.phone, email: store.email },
      t('SALES.INVOICE_DETAILS'),
      undefined,
      storeMeta
    )}

    <div class="invoice-info">
      <div class="info-box">
        <div class="info-label">${t('SALES.INVOICE_NUMBER')}</div>
        <div class="info-value">${sale.invoiceNumber}</div>
      </div>
      <div class="info-box">
        <div class="info-label">${t('SALES.DATE')}</div>
        <div class="info-value">${this.formatDate(sale.transactionDate, isArabic)}</div>
      </div>
      <div class="info-box">
        <div class="info-label">${t('SALES.PAYMENT_METHODS')}</div>
        <div class="info-value">${this.translatePaymentMethod(sale.paymentMethod)}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>${t('PRODUCTS.NAME')}</th>
          <th>${t('SALES.QUANTITY')}</th>
          <th>${t('SALES.UNIT_PRICE')}</th>
          <th>${t('SALES.TOTAL_PRICE')}</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${item.productName || t('PRODUCTS.UNNAMED')}</strong></td>
          <td>${item.quantity}</td>
          <td>${this.formatCurrency(item.unitPrice, isArabic, store.currency)}</td>
          <td><strong>${this.formatCurrency(item.totalPrice, isArabic, store.currency)}</strong></td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>${t('SALES.SUBTOTAL')}:</span>
        <span>${this.formatCurrency(sale.subtotal || sale.totalAmount, isArabic, store.currency)}</span>
      </div>
      ${(sale.discountAmount && sale.discountAmount > 0) ? `
      <div class="total-row">
        <span>${t('SALES.DISCOUNT')}:</span>
        <span style="color: #b91c1c;">-${this.formatCurrency(sale.discountAmount!, isArabic, store.currency)}</span>
      </div>` : ''}
      <div class="total-row final">
        <span>${t('SALES.GRAND_TOTAL')}:</span>
        <span>${this.formatCurrency(sale.totalAmount, isArabic, store.currency)}</span>
      </div>
    </div>

    <p class="thank-you">${t('PAYMENTS.THANK_YOU')}</p>

    ${getPrintFooterHtml(store.storeName || t('APP.NAME'), t('PAYMENTS.RECEIPT_FOOTER'), isArabic)}
  </div>
</body>
</html>`;
  }

  private getPrintStyles(isArabic: boolean): string {
    return `<style>
  ${getPrintDocumentStyles(isArabic)}
  .invoice-info { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; flex: 1; min-width: 140px; }
  .info-label { font-size: 10px; color: #64748b; margin-bottom: 4px; }
  .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
  .totals { margin-top: 14px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
  .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
  .total-row.final {
    font-size: 16px; font-weight: 700; color: #4338ca; padding-top: 8px;
    border-top: 1px solid #cbd5e1; margin-top: 8px; margin-bottom: 0;
  }
  .thank-you { text-align: center; font-weight: 700; margin-top: 18px; font-size: 13px; }
</style>`;
  }

  private formatDate(dateStr: string, isArabic: boolean): string {
    const locale = isArabic ? 'ar-EG' : 'en-US';
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  private translatePaymentMethod(method: string): string {
    if (!method) return '-';
    const key = `SALES.PAYMENT_METHODS.${method}`;
    const translated = this.translate.instant(key);
    if (translated && translated !== key) return translated;

    // Fallback labels for when translation key doesn't exist yet
    const fallback: Record<string, string> = {
      'CASH': 'Cash / نقدي',
      'VISA': 'Visa / فيزا',
      'MASTERCARD': 'Mastercard / ماستركارد',
      'CREDIT_CARD': 'Credit Card / بطاقة ائتمان',
      'DEBIT_CARD': 'Debit Card / بطاقة خصم',
      'ONLINE': 'Online / دفع إلكتروني',
      'INSURANCE': 'Insurance / تأمين',
      'WALLET': 'E-Wallet / محفظة إلكترونية',
      'INSTAPAY': 'InstaPay / إنستا باي',
      'FAWRY': 'Fawry / فوري',
      'BANK_TRANSFER': 'Bank Transfer / تحويل بنكي'
    };
    return fallback[method] || method;
  }

  private formatCurrency(amount: number, isArabic: boolean, currency: string = 'EGP'): string {
    const locale = isArabic ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
}
