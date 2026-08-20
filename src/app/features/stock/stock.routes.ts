
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const STOCK_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stock-management/stock-management.component')
            .then(m => m.StockManagementComponent)
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./stock-alerts/stock-alerts.component')
            .then(m => m.StockAlertsComponent)
      },
      {
        path: 'predictions',
        loadComponent: () =>
          import('./demand-predictions/demand-predictions.component')
            .then(m => m.DemandPredictionsComponent),
        title: 'التنبؤات'
      },
      {
        path: 'predictions/:id',
        loadComponent: () =>
          import('./prediction-detail/prediction-detail.component')
            .then(m => m.PredictionDetailComponent),
        title: 'تفاصيل التنبؤ'
      },
      {
        path: 'add-batch',
        loadComponent: () =>
          import('./stock-batch-form/stock-batch-form.component')
            .then(m => m.StockBatchFormComponent)
      },
      {
        path: 'batches/:id/edit',
        loadComponent: () =>
          import('./stock-batch-form/stock-batch-form.component')
            .then(m => m.StockBatchFormComponent)
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./stock-movements/stock-movements.component')
            .then(m => m.StockMovementsComponent)
      }
    ]
  }
];
