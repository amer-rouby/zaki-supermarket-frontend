import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  { path: '', redirectTo: 'sales', pathMatch: 'full' },
  { path: 'sales', loadComponent: () => import('./sales-report/sales-report.component').then(m => m.SalesReportComponent) },
  { path: 'stock', loadComponent: () => import('./stock-report/stock-report.component').then(m => m.StockReportComponent) },
  { path: 'financial', loadComponent: () => import('./financial-report/financial-report.component').then(m => m.FinancialReportComponent) },
  { path: 'expiry', loadComponent: () => import('./expiry-report/expiry-report.component').then(m => m.ExpiryReportComponent) }
];
