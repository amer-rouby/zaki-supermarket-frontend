import { Component, Inject, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { StockBatchService } from '../../../core/services/stock.service';
import { StockBatch } from '../../../core/models/stock.model';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-stock-adjustment-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl:"./stock-adjustment-dialog.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./stock-adjustment-dialog.component.scss"
})
export class StockAdjustmentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly stockService = inject(StockBatchService);
  private readonly errorHandler = inject(ErrorHandlerService);

  dialogRef = inject(MatDialogRef<StockAdjustmentDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  form: FormGroup;
  loading = false;

  constructor() {
    this.form = this.fb.group({
      type: ['ADD', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['OTHER', Validators.required],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    const adjustment = this.form.value;

    const storeId = this.data.storeId || 4;

    this.stockService.adjustStock(this.data.batch.id, adjustment, storeId).subscribe({
      next: () => {
        this.errorHandler.showSuccess('STOCK.ADJUSTMENT_SUCCESS', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.errorHandler.showError('STOCK.ADJUSTMENT_ERROR');
        this.loading = false;
      }
    });
  }
}
