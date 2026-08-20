import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StoreSettingsService } from './settings/store-settings.service';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly storeSettingsService = inject(StoreSettingsService);

  private readonly currencyCodeSubject = new BehaviorSubject<string>('EGP');
  readonly currencyCode$ = this.currencyCodeSubject.asObservable();

  private loaded = false;

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.storeSettingsService.getSettings().subscribe({
      next: (settings) => {
        if (settings?.currency) {
          this.currencyCodeSubject.next(settings.currency);
        }
      },
      error: () => {
        // keep the EGP default on failure
      }
    });
  }

  getCode(): string {
    this.ensureLoaded();
    return this.currencyCodeSubject.getValue();
  }

  setCode(code: string): void {
    if (code) {
      this.currencyCodeSubject.next(code);
    }
  }

  format(amount: number, lang: string): string {
    this.ensureLoaded();
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: this.getCode(),
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  getSuffix(lang: string): string {
    this.ensureLoaded();
    const code = this.getCode();
    if (lang === 'ar') {
      const arabicSuffixes: Record<string, string> = {
        EGP: 'ج.م',
        USD: '$',
        SAR: 'ر.س',
        AED: 'د.إ',
        KWD: 'د.ك',
        EUR: '€',
        GBP: '£'
      };
      return arabicSuffixes[code] || code;
    }
    return code;
  }
}
