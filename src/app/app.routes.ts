import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes')
            .then(m => m.PRODUCTS_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PHARMACIST', 'MANAGER'] }
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payment/payment.routes').then(m => m.PAYMENT_ROUTES),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      },
      {
        path: 'stock',
        loadChildren: () =>
          import('./features/stock/stock.routes')
            .then(m => m.STOCK_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PHARMACIST', 'MANAGER'] }
      },
      {
        path: 'sales',
        loadChildren: () =>
          import('./features/sales/sales.routes')
            .then(m => m.SALES_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PHARMACIST', 'MANAGER'] }
      },
      {
        path: 'expenses',
        loadChildren: () =>
          import('./features/expenses/expenses.routes')
            .then(m => m.expensesRoutes),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes')
            .then(m => m.REPORTS_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] }
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes')
            .then(m => m.SETTINGS_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes')
            .then(m => m.USERS_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notification-bell/notifications.component')
            .then(m => m.NotificationsComponent),
        title: 'التنبيهات - سوبر ماركت زكي'
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./features/help/help.component')
            .then(m => m.HelpComponent),
        title: 'قسم المساعدة'
      },
      {
        path: 'purchases',
        loadChildren: () =>
          import('./features/purchases/purchases.routes')
            .then(m => m.PURCHASES_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PHARMACIST', 'MANAGER'] }
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./features/customers/customers.routes')
            .then(m => m.CUSTOMERS_ROUTES),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PHARMACIST', 'MANAGER'] }
      },
      {
        path: '**',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
