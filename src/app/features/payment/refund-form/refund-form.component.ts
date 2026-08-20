import { Component, inject, signal, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '../../../core/services/payment.service';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-refund-form',
  standalone: true,
  imports: [ CommonModule, MaterialModule, ReactiveFormsModule, TranslateModule ],
  templateUrl: './refund-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:'./refund-form.component.scss'
})
export class RefundFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly dialogRef = inject(MatDialogRef<RefundFormComponent>);
  readonly maxAmount = inject(MAT_DIALOG_DATA)?.maxAmount || 0;
  readonly paymentReference = inject(MAT_DIALOG_DATA)?.paymentReference || '';

  readonly loading = signal(false);

  refundForm: FormGroup = this.fb.group({
    amount: ['', [Validators.required, Validators.min(0.01)]],
    reason: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.refundForm.invalid) return;
    this.loading.set(true);
    const formValue = this.refundForm.value;
    this.paymentService.refundPayment({
      paymentReference: this.paymentReference,
      amount: parseFloat(formValue.amount),
      reason: formValue.reason
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.status === 'COMPLETED') {
          this.errorHandler.showSuccess('REFUND.SUCCESS');
          this.dialogRef.close(true);
        } else {
          this.errorHandler.showError(response.message || 'REFUND.FAILED', { duration: 4000 });
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorHandler.showError('REFUND.ERROR', { duration: 4000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
