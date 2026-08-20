import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl:"./app.html",
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('zaki-supermarket-frontend');

  private readonly translate = inject(TranslateService);
  readonly direction = signal<'rtl' | 'ltr'>('rtl');
  readonly currentLang = signal<string>('ar');

  ngOnInit(): void {
    const lang = localStorage.getItem('language') || 'ar';
    this.setDirection(lang);
    this.translate.onLangChange.subscribe((event) => {
      this.setDirection(event.lang);
    });
  }

  private setDirection(lang: string): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.direction.set(dir);
    this.currentLang.set(lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}
