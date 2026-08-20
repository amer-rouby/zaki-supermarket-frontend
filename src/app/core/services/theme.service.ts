import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  readonly currentTheme$: Observable<ThemeMode> = this.currentThemeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const themeToUse: ThemeMode = savedTheme ?? (prefersDark ? 'dark' : 'light');
    this.setTheme(themeToUse);
  }

  setTheme(theme: ThemeMode): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    document.body.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#f1f5f9';
    document.body.style.color = theme === 'dark' ? '#f1f5f9' : '#1e293b';
    this.currentThemeSubject.next(theme);
    localStorage.setItem('theme', theme);
  }

  toggleTheme(): void {
    this.setTheme(this.getCurrentTheme() === 'dark' ? 'light' : 'dark');
  }

  getCurrentTheme(): ThemeMode {
    return this.currentThemeSubject.getValue();
  }

  isDark(): boolean {
    return this.getCurrentTheme() === 'dark';
  }
}
