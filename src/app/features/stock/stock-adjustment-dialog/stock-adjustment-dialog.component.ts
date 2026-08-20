import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockBatchService } from '../../../core/services/stock.service';
import { StockBatch } from '../../../core/models/stock.model';
import { TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-stock-adjustment-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl:"./stock-adjustment-dialog.component.html",
  styleUrl: "./stock-adjustment-dialog.component.scss"
})
export class StockAdjustmentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly stockService = inject(StockBatchService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

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
        this.snackBar.open(this.translate.instant('STOCK.ADJUSTMENT_SUCCESS'), 'OK', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open(this.translate.instant('STOCK.ADJUSTMENT_ERROR'), 'OK', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
