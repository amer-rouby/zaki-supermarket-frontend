import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentMethod, PaymentRequest } from '../../../core/models/payment.model';
import { AuthService } from '../../../core/services/auth.service';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly PaymentMethod = PaymentMethod;

  readonly paymentMethods = [
    { value: 'CASH', label: 'PAYMENTS.CASH', icon: 'payments' },
    { value: 'VISA', label: 'PAYMENTS.VISA', icon: 'credit_card' },
    { value: 'INSTAPAY', label: 'PAYMENTS.INSTAPAY', icon: 'account_balance' },
    { value: 'FAWRY', label: 'PAYMENTS.FAWRY', icon: 'store' },
    { value: 'WALLET', label: 'PAYMENTS.WALLET', icon: 'account_balance_wallet' },
    { value: 'BANK_TRANSFER', label: 'PAYMENTS.BANK_TRANSFER', icon: 'transfer_within_a_station' }
  ];

  paymentForm: FormGroup = this.fb.group({
    amount: ['', [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['', [Validators.required]],
    customerName: [''],
    customerPhone: [''],
    customerEmail: ['', [Validators.email]],
    description: ['']
  });

  get amount() { return this.paymentForm.get('amount'); }
  get paymentMethod() { return this.paymentForm.get('paymentMethod'); }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.paymentForm.value;

    const request: PaymentRequest = {
      storeId: this.authService.getStoreId() || 1,
      amount: parseFloat(formValue.amount),
      paymentMethod: formValue.paymentMethod,
      customerName: formValue.customerName,
      customerPhone: formValue.customerPhone,
      customerEmail: formValue.customerEmail,
      description: formValue.description
    };

    this.paymentService.processPayment(request).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.status === 'COMPLETED') {
          this.showSuccess('PAYMENT.SUCCESS');
          this.paymentForm.reset();
        } else {
          this.showError(response.message || 'PAYMENT.FAILED');
        }
      },
      error: () => {
        this.loading.set(false);
        this.showError('PAYMENT.ERROR');
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(
      this.translate.instant(message),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

  private showError(message: string): void {
    this.snackBar.open(
      this.translate.instant(message),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 4000, panelClass: ['error-snackbar'] }
    );
  }
}
