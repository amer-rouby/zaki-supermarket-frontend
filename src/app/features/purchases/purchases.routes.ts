import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./purchase-orders/purchase-orders.component')
      .then(m => m.PurchaseOrdersComponent),
    canActivate: [authGuard],
    title: 'طلبات الشراء'
  },
  {
    path: 'new',
    loadComponent: () => import('./purchase-form/purchase-form.component')
      .then(m => m.PurchaseFormComponent),
    canActivate: [authGuard],
    title: 'إنشاء طلب شراء'
  },
  {
    path: 'suppliers',
    loadComponent: () => import('./suppliers/suppliers.component')
      .then(m => m.SuppliersComponent),
    canActivate: [authGuard],
    title: 'إدارة الموردين'
  },
  {
    path: ':id',
    loadComponent: () => import('./purchase-detail/purchase-detail.component')
      .then(m => m.PurchaseDetailComponent),
    canActivate: [authGuard],
    title: 'تفاصيل طلب الشراء'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./purchase-form/purchase-form.component')
      .then(m => m.PurchaseFormComponent),
    canActivate: [authGuard],
    title: 'تعديل طلب الشراء'
  }
];
