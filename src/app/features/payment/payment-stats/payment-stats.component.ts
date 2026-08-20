import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-payment-stats',
  standalone: true,
  imports: [
    MaterialModule
  ],
  templateUrl: './payment-stats.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:'./payment-stats.component.scss'
})
export class PaymentStatsComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(AuthService);
  readonly stats = signal<any>({ completedPayments: 0, totalAmount: 0, pendingPayments: 0 });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    const storeId = this.authService.getStoreId() || 1;
    this.paymentService.getPaymentStats(storeId).subscribe({
      next: (data) => this.stats.set(data),
      error: (error) => console.error('Error loading payment stats:', error)
    });
  }
}
