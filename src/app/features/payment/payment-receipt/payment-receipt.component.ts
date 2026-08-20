import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { Payment } from '../../../core/models/payment.model';
import { MaterialModule } from '../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-payment-receipt',
  standalone: true,
  imports: [MaterialModule, CommonModule, TranslateModule],
  templateUrl: './payment-receipt.component.html',
  styleUrl: './payment-receipt.component.scss'
})
export class PaymentReceiptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);
  private readonly currencyService = inject(CurrencyService);

  payment: Payment | null = null;
  loading = true;
  error = false;

  ngOnInit(): void {
    const referenceNumber = this.route.snapshot.paramMap.get('id');
    if (referenceNumber) {
      this.loadPayment(referenceNumber);
    } else {
      this.showError('No payment reference provided');
    }

    setTimeout(() => window.print(), 1000);
  }

  private loadPayment(referenceNumber: string): void {
    this.paymentService.verifyPayment(referenceNumber).subscribe({
      next: (response) => {
        if (response && response.referenceNumber) {
          this.payment = response as Payment;
          this.loading = false;
        } else {
          this.showError('Payment not found');
        }
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        this.error = true;
        this.loading = false;
        this.showError('Failed to load payment details');
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      COMPLETED: 'PAYMENTS.COMPLETED',
      PENDING: 'PAYMENTS.PENDING',
      PROCESSING: 'PAYMENTS.PROCESSING',
      FAILED: 'PAYMENTS.FAILED',
      CANCELLED: 'PAYMENTS.CANCELLED',
      REFUNDED: 'PAYMENTS.REFUNDED'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      COMPLETED: '#10b981',
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      FAILED: '#ef4444',
      CANCELLED: '#6b7280',
      REFUNDED: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      CASH: 'payments',
      VISA: 'credit_card',
      MASTERCARD: 'credit_card',
      INSTAPAY: 'account_balance',
      FAWRY: 'store',
      WALLET: 'account_balance_wallet',
      BANK_TRANSFER: 'transfer_within_a_station'
    };
    return icons[method] || 'payment';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'PAYMENTS.CASH',
      VISA: 'PAYMENTS.VISA',
      MASTERCARD: 'PAYMENTS.MASTERCARD',
      INSTAPAY: 'PAYMENTS.INSTAPAY',
      FAWRY: 'PAYMENTS.FAWRY',
      WALLET: 'PAYMENTS.WALLET',
      BANK_TRANSFER: 'PAYMENTS.BANK_TRANSFER'
    };
    return labels[method] || method;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ar-EG');
  }

  formatAmount(amount: number | undefined): string {
    if (!amount) return this.currencyService.format(0, 'ar');
    return this.currencyService.format(amount, 'ar');
  }

  printReceipt(): void {
    window.print();
  }

  closeReceipt(): void {
    window.close();
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'OK'
    });
  }
}
