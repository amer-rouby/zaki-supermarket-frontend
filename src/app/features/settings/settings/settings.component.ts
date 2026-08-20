import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

interface SettingsItem {
  icon: string;
  labelKey: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly authService = inject(AuthService);

  readonly settingsItems = signal<SettingsItem[]>([
    { icon: 'person', labelKey: 'SETTINGS.PROFILE', route: '/settings/profile' },
    { icon: 'people', labelKey: 'SETTINGS.USERS', route: '/users', roles: ['ADMIN'] },
    { icon: 'store', labelKey: 'SETTINGS.STORE', route: '/settings/store', roles: ['ADMIN'] },
    { icon: 'notifications', labelKey: 'SETTINGS.NOTIFICATIONS', route: '/settings/notifications' },
    { icon: 'security', labelKey: 'SETTINGS.SECURITY', route: '/settings/security' },
    { icon: 'timer', labelKey: 'SETTINGS.SESSION.TITLE', route: '/settings/session' },
    // { icon: 'language', labelKey: 'SETTINGS.LANGUAGE', route: '/settings/language' },
    { icon: 'backup', labelKey: 'SETTINGS.BACKUP', route: '/settings/backup' }
  ]);

  readonly filteredItems = signal<SettingsItem[]>([]);

  ngOnInit(): void {
    this.filterItemsByRole();
  }

  filterItemsByRole(): void {
    const userRole = this.authService.getCurrentUser()?.role;
    const items = this.settingsItems().filter(item =>
      !item.roles || (userRole && item.roles.includes(userRole))
    );
    this.filteredItems.set(items);
  }

  getLabel(key: string): string {
    return this.translate.instant(key);
  }

  getCurrentLang(): string {
    return this.languageService.getCurrentLanguage();
  }
}
