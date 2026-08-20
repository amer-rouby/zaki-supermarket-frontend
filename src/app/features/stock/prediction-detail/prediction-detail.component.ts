import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { DemandPrediction, DemandPredictionService } from '../../../core/services/demand-prediction.service';

@Component({
  selector: 'app-prediction-detail',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, RouterLink, CommonModule],
  templateUrl: './prediction-detail.component.html',
  styleUrl: './prediction-detail.component.scss'
})
export class PredictionDetailComponent implements OnInit {
  private readonly predictionService = inject(DemandPredictionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly prediction = signal<DemandPrediction | null>(null);
  readonly salesHistory = signal<Array<{ date: string; quantity: number; sales: number }>>([]);

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
          this.showError('PREDICTIONS.NOT_FOUND');
          this.router.navigate(['/stock/predictions']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('PREDICTIONS.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  loadSalesHistory(productId: number): void {
    this.salesHistory.set([
      { date: '2026-02-25', quantity: 5, sales: 450 },
      { date: '2026-02-26', quantity: 3, sales: 270 },
      { date: '2026-02-27', quantity: 7, sales: 630 },
      { date: '2026-02-28', quantity: 4, sales: 360 },
      { date: '2026-03-01', quantity: 6, sales: 540 }
    ]);
  }

  onCreatePurchaseOrder(): void {
    const pred = this.prediction();
    if (!pred || pred.recommendedOrder <= 0) {
      this.showError('PREDICTIONS.INVALID_PRODUCT');
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

  private showSuccess(message: string, params?: any): void {
    this.snackBar.open(
      this.translate.instant(message, params),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

  private showError(message: string): void {
    this.snackBar.open(
      this.translate.instant(message),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 3000, panelClass: ['error-snackbar'] }
    );
  }
}
