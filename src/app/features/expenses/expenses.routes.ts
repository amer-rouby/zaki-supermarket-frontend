import { Routes } from '@angular/router';

export const expensesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./expenses.component')
      .then(m => m.ExpensesComponent)
  }
];
