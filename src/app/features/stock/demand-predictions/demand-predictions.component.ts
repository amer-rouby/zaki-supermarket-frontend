import { Component, inject, signal, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';
import { DemandPredictionService, DemandPrediction, PredictionStats, UpdatePredictionDTO } from '../../../core/services/demand-prediction.service';
import { EditPredictionDialogComponent } from '../edit-prediction-dialog/edit-prediction-dialog.component';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-demand-predictions',
  standalone: true,
  imports: [
    MaterialModule,
    PageHeaderComponent,
    MatPaginatorModule,
    MatMenuModule
  ],
  templateUrl: './demand-predictions.component.html',
  styleUrl: './demand-predictions.component.scss'
})
export class DemandPredictionsComponent implements OnInit {
  private readonly predictionService = inject(DemandPredictionService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly router = inject(Router);
  readonly loading = signal(false);
  readonly predictions = signal<DemandPrediction[]>([]);
  readonly stats = signal<PredictionStats | null>(null);
  readonly daysAhead = signal(7);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly exportLoading = signal(false);

  readonly displayedColumns = [
    'productName', 'predictionDate', 'predictedQuantity',
    'currentStock', 'recommendedOrder', 'trend', 'confidence', 'actions'
  ];

  ngOnInit(): void {
    this.loadPredictions();
    this.loadStats();
  }

  loadPredictions(): void {
    this.loading.set(true);
    this.predictionService.getPredictionsWithPagination(this.pageIndex(), this.pageSize()).subscribe({
      next: (data) => {
        this.predictions.set(data.content || []);
        this.totalElements.set(data.totalElements || 0);
        this.loading.set(false);
      },
      error: () => {
        this.errorHandler.showError('PREDICTIONS.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.predictionService.getAccuracyStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => { }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPredictions();
  }

  onGeneratePredictions(): void {
    this.loading.set(true);
    this.predictionService.generatePredictions().subscribe({
      next: () => {
        this.loading.set(false);
        this.loadPredictions();
        this.loadStats();
        this.errorHandler.showSuccess('PREDICTIONS.GENERATED');
      },
      error: () => {
        this.loading.set(false);
        this.errorHandler.showError('PREDICTIONS.GENERATE_ERROR');
      }
    });
  }

  onViewPrediction(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }
    this.router.navigate(['/stock/predictions', prediction.predictionId]);
  }

  onCreatePurchaseOrder(prediction: DemandPrediction): void {
    if (!prediction?.productId || prediction.recommendedOrder <= 0) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PRODUCT');
      return;
    }

    this.confirmDialog.open({
      titleKey: 'PREDICTIONS.CONFIRM_PURCHASE_TITLE',
      messageKey: 'PREDICTIONS.CONFIRM_PURCHASE',
      messageParams: { product: prediction.productName, quantity: prediction.recommendedOrder },
      confirmKey: 'COMMON.CONFIRM',
      width: '400px',
      color: 'primary'
    }).subscribe(result => {
      if (result) {
        this.router.navigate(['/purchases/new'], {
          queryParams: {
            productId: prediction.productId,
            quantity: prediction.recommendedOrder,
            predictionId: prediction.predictionId,
            source: 'prediction'
          }
        });
      }
    });
  }

  onQuickOrder(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }

    this.confirmDialog.open({
      titleKey: 'PREDICTIONS.QUICK_ORDER',
      messageKey: 'PREDICTIONS.CONFIRM_QUICK_ORDER',
      messageParams: { product: prediction.productName },
      confirmKey: 'COMMON.CONFIRM',
      width: '400px',
      color: 'accent'
    }).subscribe(result => {
      if (result) {
        this.loading.set(true);
        this.predictionService.createPurchaseFromPrediction(prediction.predictionId).subscribe({
          next: () => {
            this.loading.set(false);
            this.errorHandler.showSuccess('PREDICTIONS.ORDER_CREATED', { params: { product: prediction.productName } });
            this.loadPredictions();
          },
          error: () => {
            this.loading.set(false);
            this.errorHandler.showError('PREDICTIONS.ORDER_ERROR');
          }
        });
      }
    });
  }

  onEditPrediction(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }

    const dialogRef = this.dialog.open(EditPredictionDialogComponent, {
      width: '600px',
      data: {
        prediction: { ...prediction }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updatePrediction(prediction.predictionId, result);
      }
    });
  }

  private updatePrediction(id: number, updates: UpdatePredictionDTO): void {
    this.loading.set(true);
    this.predictionService.updatePrediction(id, updates).subscribe({
      next: (updated) => {
        this.loading.set(false);
        this.errorHandler.showSuccess('PREDICTIONS.UPDATED_SUCCESS');
        this.loadPredictions();
      },
      error: () => {
        this.loading.set(false);
        this.errorHandler.showError('PREDICTIONS.UPDATE_ERROR');
      }
    });
  }

  onDeletePrediction(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }

    this.confirmDialog.open({
      titleKey: 'PREDICTIONS.CONFIRM_DELETE_TITLE',
      messageKey: 'PREDICTIONS.CONFIRM_DELETE',
      messageParams: { product: prediction.productName },
      confirmKey: 'COMMON.DELETE',
      width: '400px',
      color: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);
        this.predictionService.deletePrediction(prediction.predictionId).subscribe({
          next: () => {
            this.loading.set(false);
            this.errorHandler.showSuccess('PREDICTIONS.DELETED_SUCCESS');
            this.loadPredictions();
          },
          error: () => {
            this.loading.set(false);
            this.errorHandler.showError('PREDICTIONS.DELETE_ERROR');
          }
        });
      }
    });
  }

  onExportPdf(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }

    this.exportLoading.set(true);
    this.predictionService.exportToPdf(prediction.predictionId).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `prediction_${prediction.predictionId}.pdf`, 'application/pdf');
        this.exportLoading.set(false);
        this.errorHandler.showSuccess('PREDICTIONS.EXPORTED_SUCCESS');
      },
      error: () => {
        this.exportLoading.set(false);
        this.errorHandler.showError('PREDICTIONS.EXPORT_ERROR');
      }
    });
  }

  onExportExcel(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }

    this.exportLoading.set(true);
    this.predictionService.exportToExcel(prediction.predictionId).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `prediction_${prediction.predictionId}.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        this.exportLoading.set(false);
        this.errorHandler.showSuccess('PREDICTIONS.EXPORTED_SUCCESS');
      },
      error: () => {
        this.exportLoading.set(false);
        this.errorHandler.showError('PREDICTIONS.EXPORT_ERROR');
      }
    });
  }

  onSharePrediction(prediction: DemandPrediction): void {
    if (!prediction?.predictionId) {
      this.errorHandler.showError('PREDICTIONS.INVALID_PREDICTION');
      return;
    }

    this.dialog.open(ShareDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        entityType: 'PREDICTION',
        entityId: prediction.predictionId,
        entityName: prediction.productName
      }
    });
  }

  private downloadFile(blob: Blob, filename: string, type: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.errorHandler.showSuccess('PREDICTIONS.LINK_COPIED');
      }).catch(() => this.fallbackCopy(text));
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
      this.errorHandler.showSuccess('PREDICTIONS.LINK_COPIED');
    } catch (err) {
      console.error('Copy failed:', err);
      this.errorHandler.showError('PREDICTIONS.COPY_ERROR');
    } finally {
      document.body.removeChild(textarea);
    }
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

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  }

  getRecommendationColor(recommendedOrder: number): string {
    if (recommendedOrder > 50) return '#ef4444';
    if (recommendedOrder > 20) return '#f59e0b';
    return '#10b981';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysUntil(dateString: string): number {
    const predictionDate = new Date(dateString);
    const today = new Date();
    const diffTime = predictionDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

}
