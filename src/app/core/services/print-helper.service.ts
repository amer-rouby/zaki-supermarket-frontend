import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { CurrencyService } from './currency.service';
import { AuthService } from './auth.service';
import { getPrintDocumentStyles, getPrintFooterHtml, getPrintLetterheadHtml } from './print-document.util';

export interface PrintOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: PrintColumn[];
  summary?: PrintSummary[];
  direction?: 'rtl' | 'ltr';
}

export interface PrintColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
  width?: string;
}

export interface PrintSummary {
  label: string;
  value: string | number;
  type?: 'text' | 'number' | 'currency';
}

@Injectable({
  providedIn: 'root'
})
export class PrintHelperService {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly authService = inject(AuthService);

  /**
   * Opens a print-ready window with the report data.
   * Uses browser's native print dialog - no download, no backend PDF.
   */
  printReport(options: PrintOptions): void {
    const isArabic = this.languageService.getCurrentLanguage() === 'ar';
    const dir = options.direction || (isArabic ? 'rtl' : 'ltr');
    const lang = isArabic ? 'ar' : 'en';

    const t = (key: string): string => {
      const val = this.translate.instant(key);
      return val && val !== key ? val : key;
    };

    const html = this.generatePrintHtml(options, t, isArabic, dir, lang);

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);

    // Write content to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remove iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        }, 300);
      };
    }
  }

  private generatePrintHtml(
    options: PrintOptions,
    t: (key: string) => string,
    isArabic: boolean,
    dir: string,
    lang: string
  ): string {
    const summaryHtml = options.summary?.length ? `
      <div class="summary-section">
        <div class="summary-grid">
          ${options.summary.map(item => `
            <div class="summary-item">
              <div class="summary-label">${item.label}</div>
              <div class="summary-value">${this.formatValue(item.value, item.type || 'text', isArabic)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const tableHtml = options.data.length > 0 ? `
      <table class="data-table">
        <thead>
          <tr>
            ${options.columns.map(col => `
              <th style="${col.width ? `width: ${col.width}` : ''}">${col.label}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${options.data.map(row => `
            <tr>
              ${options.columns.map(col => `
                <td>${this.formatValue(row[col.key], col.type || 'text', isArabic)}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `
      <div class="no-data">
        <p>${t('REPORTS.NO_DATA') || 'No data available'}</p>
      </div>
    `;

    const storeName = this.authService.getStoreInfo()?.name || t('APP.NAME');
    const generatedMeta = `${t('REPORTS.GENERATED') || 'Generated'}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

    return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <style>
    ${getPrintDocumentStyles(isArabic)}
    .summary-section { margin-bottom: 20px; }
    .summary-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .summary-item {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 10px 16px; min-width: 130px; text-align: center;
    }
    .summary-label { font-size: 10px; color: #64748b; margin-bottom: 4px; }
    .summary-value { font-size: 15px; font-weight: 700; color: #1e293b; }
    .no-data { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="print-doc">
    ${getPrintLetterheadHtml({ name: storeName }, options.title, options.subtitle, generatedMeta)}
    ${summaryHtml}
    ${tableHtml}
    ${getPrintFooterHtml(t('APP.NAME'), t('REPORTS.GENERATED') || 'Generated', isArabic)}
  </div>
</body>
</html>`;
  }

  private formatValue(value: any, type: string, isArabic: boolean): string {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en-US', {
          style: 'currency',
          currency: this.currencyService.getCode(),
          minimumFractionDigits: 2
        }).format(value);

      case 'number':
        return new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en-US').format(value);

      case 'date':
        try {
          return new Date(value).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
        } catch {
          return value;
        }

      default:
        return value;
    }
  }
}
