import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { LanguageService } from '../../core/services/language.service';
import { inject } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly languageService = inject(LanguageService);

  readonly currentLang = signal<string>(this.languageService.getCurrentLanguage());
  readonly isSidebarCollapsed = signal(false);
  readonly isMobile = signal(false);
  readonly isSidebarOpen = signal(false);

  private langSubscription?: Subscription;

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    this.langSubscription = this.languageService.currentLang$.subscribe(lang => {
      this.currentLang.set(lang);
    });
  }

  checkScreenSize(): void {
    this.isMobile.set(window.innerWidth <= 768);
    if (this.isMobile()) {
      this.isSidebarCollapsed.set(false);
      this.isSidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.isSidebarOpen.update(v => !v);
    } else {
      this.isSidebarCollapsed.update(v => !v);
    }
  }

  closeSidebar(): void {
    if (this.isMobile()) {
      this.isSidebarOpen.set(false);
    }
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }
}
