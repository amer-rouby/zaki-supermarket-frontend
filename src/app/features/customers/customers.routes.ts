import { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./customers/customers.component').then(m => m.CustomersComponent) }
];
