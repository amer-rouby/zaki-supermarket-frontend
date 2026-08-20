import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '../../../core/services/payment.service';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-refund-form',
  standalone: true,
  imports: [ CommonModule, MaterialModule, ReactiveFormsModule, TranslateModule ],
  templateUrl: './refund-form.component.html',
  styleUrl:'./refund-form.component.scss'
})
export class RefundFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
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
          this.showSuccess('REFUND.SUCCESS');
          this.dialogRef.close(true);
        } else {
          this.showError(response.message || 'REFUND.FAILED');
        }
      },
      error: () => {
        this.loading.set(false);
        this.showError('REFUND.ERROR');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(this.translate.instant(message), this.translate.instant('COMMON.CLOSE'), { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(this.translate.instant(message), this.translate.instant('COMMON.CLOSE'), { duration: 4000, panelClass: ['error-snackbar'] });
  }
}
