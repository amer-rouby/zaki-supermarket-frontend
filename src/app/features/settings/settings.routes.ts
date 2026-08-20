import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings/settings.component')
      .then(m => m.SettingsComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile-settings.component')
      .then(m => m.ProfileSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'store',
    loadComponent: () => import('./store/store-settings.component')
      .then(m => m.StoreSettingsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'users',
    loadChildren: () => import('../users/users.routes')
      .then(m => m.USERS_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notification-settings.component')
      .then(m => m.NotificationSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'security',
    loadComponent: () => import('./security/security-settings.component')
      .then(m => m.SecuritySettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'session',
    loadComponent: () => import('./security/session-settings.component')
      .then(m => m.SessionSettingsComponent),
    canActivate: [authGuard]
  },
  // {
  //   path: 'language',
  //   loadComponent: () => import('./language/language-settings.component')
  //     .then(m => m.LanguageSettingsComponent),
  //   canActivate: [authGuard]
  // },
  {
    path: 'backup',
    loadComponent: () => import('./backup/backup-settings.component')
      .then(m => m.BackupSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'zaki-features',
    loadComponent: () => import('./zaki-features/zaki-features-settings.component')
      .then(m => m.ZakiFeaturesSettingsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  }
];
