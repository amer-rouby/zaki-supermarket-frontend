// src/app/shared/components/language-switcher/language-switcher.component.ts
import { Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MaterialModule, TranslateModule],
  template: `
    <button mat-icon-button
            [matMenuTriggerFor]="langMenu"
            [matTooltip]="'HEADER.CHOOSE_LANGUAGE' | translate"
            class="lang-switcher-btn"
            aria-label="تبديل اللغة">
      <mat-icon>language</mat-icon>
      <span class="current-lang">{{currentLang()}}</span>
    </button>

    <mat-menu #langMenu="matMenu" xPosition="before" yPosition="below">
      <button mat-menu-item
              (click)="changeLanguage('ar')"
              [class.active]="currentLang() === 'ar'">
        <mat-icon>translate</mat-icon>
        <span>{{'LANGUAGE.ARABIC' | translate}}</span>
        @if (currentLang() === 'ar') {
          <mat-icon color="accent">check</mat-icon>
        }
      </button>

      <button mat-menu-item
              (click)="changeLanguage('en')"
              [class.active]="currentLang() === 'en'">
        <mat-icon>translate</mat-icon>
        <span>{{'LANGUAGE.ENGLISH' | translate}}</span>
        @if (currentLang() === 'en') {
          <mat-icon color="accent">check</mat-icon>
        }
      </button>
    </mat-menu>
  `,
  styles: [`
    .lang-switcher-btn {
      position: relative;

      .current-lang {
        position: absolute;
        bottom: 2px;
        right: 2px;
        font-size: 9px;
        font-weight: 700;
        background: #667eea;
        color: white;
        padding: 1px 4px;
        border-radius: 4px;
        line-height: 1;
      }
    }

    button.active {
      background: rgba(102, 126, 234, 0.1);
      font-weight: 600;
    }

    button.active mat-icon:last-child {
      margin-inline-start: auto;
    }
  `]
})
export class LanguageSwitcherComponent {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  readonly currentLang = signal<string>('ar');

  constructor() {
    const saved = localStorage.getItem('language');
    if (saved === 'ar' || saved === 'en') {
      this.currentLang.set(saved);
    }
  }

  changeLanguage(lang: 'ar' | 'en'): void {
    // ✅ استخدام LanguageService لتغيير اللغة والاتجاه
    this.languageService.setLanguage(lang);
    this.currentLang.set(lang);
  }
}
