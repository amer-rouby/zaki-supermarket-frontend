import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full'
  },
  {
    path: 'form',
    loadComponent: () => import('./payment-form/payment-form.component')
      .then(m => m.PaymentFormComponent),
    title: 'دفع جديد',
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./payment-history/payment-history.component')
      .then(m => m.PaymentHistoryComponent),
    title: 'سجل المدفوعات',
    canActivate: [authGuard]
  },
  {
    path: 'receipt/:id',
    loadComponent: () => import('./payment-receipt/payment-receipt.component')
      .then(m => m.PaymentReceiptComponent),
    title: 'إيصال الدفع',
    canActivate: [authGuard]
  },
  {
    path: 'stats',
    loadComponent: () => import('./payment-stats/payment-stats.component')
      .then(m => m.PaymentStatsComponent),
    title: 'إيصال الدفع',
    canActivate: [authGuard]
  }
];
