import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { AnomalyService } from '../../../core/services/anomaly.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { TableLoadingComponent } from '../../../shared/components/table-loading/table-loading.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Anomaly, AnomalyCounts, AnomalyStatus, AnomalyType } from '../../../core/models/anomaly.model';

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [
    MaterialModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    MatPaginatorModule,
    TableLoadingComponent,
    EmptyStateComponent
  ],
  templateUrl: './anomalies.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './anomalies.component.scss'
})
export class AnomaliesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly anomalyService = inject(AnomalyService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly loading = signal(false);
  readonly anomalies = signal<Anomaly[]>([]);
  readonly counts = signal<AnomalyCounts | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['type', 'description', 'severity', 'status', 'detectedAt', 'actions'];
  readonly filterForm: FormGroup = this.fb.group({ status: ['all'], type: ['all'] });

  ngOnInit(): void {
    this.loadAnomalies();
    this.loadCounts();
  }

  loadAnomalies(): void {
    this.loading.set(true);
    const status = this.filterForm.get('status')?.value;
    const type = this.filterForm.get('type')?.value;
    this.anomalyService.getAnomalies(
      status !== 'all' ? (status as AnomalyStatus) : undefined,
      type !== 'all' ? (type as AnomalyType) : undefined,
      this.pageIndex(),
      this.pageSize()
    ).subscribe({
      next: (data) => {
        this.anomalies.set(data.content || []);
        this.totalElements.set(data.totalElements || 0);
        this.loading.set(false);
      },
      error: () => {
        this.errorHandler.showError('ANOMALIES.LOAD_ERROR');
        this.loading.set(false);
      }
    });
  }

  loadCounts(): void {
    this.anomalyService.getCounts().subscribe({
      next: (data) => this.counts.set(data)
    });
  }

  onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadAnomalies();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAnomalies();
  }

  onMarkReviewed(anomaly: Anomaly): void {
    this.anomalyService.markReviewed(anomaly.id).subscribe({
      next: () => {
        this.errorHandler.showSuccess('ANOMALIES.MARKED_REVIEWED');
        this.loadAnomalies();
        this.loadCounts();
      },
      error: () => this.errorHandler.showError('ANOMALIES.UPDATE_ERROR')
    });
  }

  onDismiss(anomaly: Anomaly): void {
    this.confirmDialog.open({
      titleKey: 'ANOMALIES.CONFIRM_DISMISS_TITLE',
      messageKey: 'ANOMALIES.CONFIRM_DISMISS_MSG',
      confirmKey: 'COMMON.CONFIRM',
      color: 'primary'
    }).subscribe(result => {
      if (result) {
        this.anomalyService.dismiss(anomaly.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('ANOMALIES.DISMISSED');
            this.loadAnomalies();
            this.loadCounts();
          },
          error: () => this.errorHandler.showError('ANOMALIES.UPDATE_ERROR')
        });
      }
    });
  }

  getTypeLabel(type: string): string {
    return this.translate.instant('ANOMALIES.TYPE.' + type);
  }

  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = { 'LOW': '#10b981', 'MEDIUM': '#f59e0b', 'HIGH': '#ef4444' };
    return colors[severity] || '#6b7280';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = { 'NEW': '#3b82f6', 'REVIEWED': '#10b981', 'DISMISSED': '#6b7280' };
    return colors[status] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    return this.translate.instant('ANOMALIES.STATUS.' + status);
  }
}
