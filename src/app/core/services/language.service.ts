// src/app/core/services/language.service.ts
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly currentLangSubject = new BehaviorSubject<string>('ar');
  private readonly supportedLanguages = ['ar', 'en'];
  private readonly defaultLanguage = 'ar';

  readonly currentLang$: Observable<string> = this.currentLangSubject.asObservable();

  constructor() {
    this.translate.addLangs(this.supportedLanguages);
    this.translate.setDefaultLang(this.defaultLanguage);
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    const savedLang = localStorage.getItem('language');
    const browserLang = this.translate.getBrowserLang();
    const langToUse = savedLang ||
      (this.supportedLanguages.includes(browserLang!) ? browserLang! : this.defaultLanguage);

    this.setLanguage(langToUse as 'ar' | 'en');
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.translate.use(lang);
    this.currentLangSubject.next(lang);
    localStorage.setItem('language', lang);

    // ✅ تغيير اتجاه الصفحة
    this.setDirection(lang);

    console.log(`Language changed to ${lang}, direction: ${lang === 'ar' ? 'RTL' : 'LTR'}`);
  }

  private setDirection(lang: string): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    // تحديث html tag
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // تحديث body tag
    document.body.setAttribute('dir', dir);

    // إضافة class للـ body
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(dir);
  }

  getCurrentLanguage(): string {
    return this.currentLangSubject.getValue();
  }

  isRTL(): boolean {
    return this.getCurrentLanguage() === 'ar';
  }

  isLTR(): boolean {
    return this.getCurrentLanguage() === 'en';
  }

  toggleLanguage(): void {
    const current = this.getCurrentLanguage();
    const newLang = current === 'ar' ? 'en' : 'ar';
    this.setLanguage(newLang);
  }
}
