import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { DemandPrediction, DemandPredictionService, SalesHistoryPoint } from '../../../core/services/demand-prediction.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-prediction-detail',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, RouterLink, CommonModule],
  templateUrl: './prediction-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './prediction-detail.component.scss'
})
export class PredictionDetailComponent implements OnInit {
  private readonly predictionService = inject(DemandPredictionService);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly prediction = signal<DemandPrediction | null>(null);
  readonly salesHistory = signal<SalesHistoryPoint[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPredictionDetail(+id);
    }
  }

  loadPredictionDetail(id: number): void {
    this.loading.set(true);
    this.predictionService.getPredictionsWithPagination(0, 100).subscribe({
      next: (data) => {
        const pred = data.content.find(p => p.predictionId === id);
        if (pred) {
          this.prediction.set(pred);
          this.loadSalesHistory(pred.productId);
        } else {
          this.errorHandler.showError('PREDICTIONS.NOT_FOUND');
          this.router.navigate(['/stock/predictions']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorHandler.showError('PREDICTIONS.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  loadSalesHistory(productId: number): void {
    this.predictionService.getProductSalesHistory(productId, 30).subscribe({
      next: (history) => this.salesHistory.set(history)
    });
  }

  onCreatePurchaseOrder(): void {
    const pred = this.prediction();
    if (!pred || pred.recommendedOrder <= 0) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PRODUCT');
      return;
    }
    this.router.navigate(['/purchases/new'], {
      queryParams: {
        productId: pred.productId,
        quantity: pred.recommendedOrder,
        predictionId: pred.predictionId,
        source: 'prediction'
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTrendIcon(trend: string): string {
    const icons: Record<string, string> = {
      'increasing': 'trending_up',
      'decreasing': 'trending_down',
      'stable': 'trending_flat'
    };
    return icons[trend] || 'trending_flat';
  }

  getTrendColor(trend: string): string {
    const colors: Record<string, string> = {
      'increasing': '#ef4444',
      'decreasing': '#10b981',
      'stable': '#6b7280'
    };
    return colors[trend] || '#6b7280';
  }

  getRiskColor(riskLevel: string | null): string {
    const colors: Record<string, string> = {
      'CRITICAL': '#dc2626',
      'HIGH': '#ef4444',
      'MEDIUM': '#f59e0b',
      'LOW': '#10b981'
    };
    return riskLevel ? colors[riskLevel] || '#6b7280' : '#6b7280';
  }
}
