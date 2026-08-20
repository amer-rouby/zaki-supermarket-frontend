import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'pos',
    pathMatch: 'full'
  },
  {
    path: 'pos',
    loadComponent: () => import('./sales-form/sales-form.component')
      .then(m => m.SalesFormComponent)
  },
  {
    path: 'analytics',  // <-- أضف هذا
    loadComponent: () => import('./sales-analytics/sales-analytics.component')
      .then(m => m.SalesAnalyticsComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./sales-history/sales-history.component')
      .then(m => m.SalesHistoryComponent)
  },

];
