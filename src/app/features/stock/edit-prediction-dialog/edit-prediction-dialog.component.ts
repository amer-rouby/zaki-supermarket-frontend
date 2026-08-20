import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { FormsModule } from '@angular/forms';

export interface UpdatePredictionDTO {
  predictedQuantity?: number;
  confidenceLevel?: number;
  recommendation?: string;
  notes?: string;
}

@Component({
  selector: 'app-edit-prediction-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule],
  templateUrl: "./edit-prediction-dialog.component.html",
  styleUrl: "./edit-prediction-dialog.component.scss"
})
export class EditPredictionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EditPredictionDialogComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const updates: UpdatePredictionDTO = {
      predictedQuantity: this.data.prediction.predictedQuantity,
      confidenceLevel: this.data.prediction.confidenceLevel,
      recommendation: this.data.prediction.recommendation
    };
    this.dialogRef.close(updates);
  }
}
