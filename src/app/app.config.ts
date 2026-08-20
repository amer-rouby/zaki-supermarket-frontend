// src/app/app.config.ts
import {
  ApplicationConfig,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { TranslateLoader, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorIntl } from '@angular/material/paginator';
import { LanguageService } from './core/services/language.service';
import { AppPaginatorIntl } from './core/services/app-paginator-intl.service';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) { }

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`assets/i18n/${lang}.json`);
  }
}

export function initializeApp() {
  const translate = inject(TranslateService);
  const languageService = inject(LanguageService);

  return async () => {
    const savedLang = localStorage.getItem('language') || 'ar';
    translate.setFallbackLang('ar');

    try {
      await firstValueFrom(translate.use(savedLang));
      languageService.setLanguage(savedLang as 'ar' | 'en');
    } catch (err) {
      console.error('Translation failed', err);
      languageService.setLanguage('ar');
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    provideCharts(withDefaultRegisterables()),
    provideTranslateService({
      defaultLanguage: 'ar',
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => new CustomTranslateLoader(http),
        deps: [HttpClient]
      }
    }),
    provideAppInitializer(() => {
      const initFn = initializeApp();
      return initFn();
    }),
    {
      provide: MAT_PAGINATOR_DEFAULT_OPTIONS,
      useValue: {
        pageSize: 10,
        pageSizeOptions: [5, 10, 20, 50],
        formFieldAppearance: 'outline'
      }
    },
    { provide: MatPaginatorIntl, useClass: AppPaginatorIntl }
  ]
};
