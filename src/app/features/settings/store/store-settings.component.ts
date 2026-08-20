import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { StoreSettingsService } from '../../../core/services/settings/store-settings.service';
import { StoreSettings, StoreSettingsRequest } from '../../../core/models/settings/store-settings.model';
import { CurrencyService } from '../../../core/services/currency.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './store-settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './store-settings.component.scss'
})
export class StoreSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly storeSettingsService = inject(StoreSettingsService);
  private readonly currencyService = inject(CurrencyService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly form: FormGroup;

  readonly currencies = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'KWD'];

  readonly allPaymentMethods = ['CASH', 'VISA', 'MASTERCARD', 'INSTAPAY', 'FAWRY', 'WALLET', 'BANK_TRANSFER'];
  readonly selectedPaymentMethods = signal<Set<string>>(new Set(this.allPaymentMethods));
  readonly timezones = [
    { value: 'Africa/Cairo', label: 'القاهرة' },
    { value: 'Asia/Riyadh', label: 'الرياض' },
    { value: 'Asia/Dubai', label: 'دبي' }
  ];
  readonly dateFormats = [
    { value: 'dd/MM/yyyy', label: 'يوم/شهر/سنة' },
    { value: 'MM/dd/yyyy', label: 'شهر/يوم/سنة' },
    { value: 'yyyy-MM-dd', label: 'سنة-شهر-يوم' }
  ];
  readonly timeFormats = [
    { value: '24h', label: '24 ساعة' },
    { value: '12h', label: '12 ساعة' }
  ];

  constructor() {
    this.form = this.fb.group({
      storeName: ['', [Validators.required, Validators.maxLength(100)]],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      licenseNumber: [''],
      taxNumber: [''],
      commercialRegister: [''],
      logoUrl: [''],
      currency: ['EGP'],
      timezone: ['Africa/Cairo'],
      dateFormat: ['dd/MM/yyyy'],
      timeFormat: ['24h'],
      largeSaleThreshold: [5000, [Validators.required, Validators.min(0)]],
      largeExpenseThreshold: [2000, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  isPaymentMethodEnabled(method: string): boolean {
    return this.selectedPaymentMethods().has(method);
  }

  togglePaymentMethod(method: string): void {
    this.selectedPaymentMethods.update(current => {
      const next = new Set(current);
      if (next.has(method)) {
        next.delete(method);
      } else {
        next.add(method);
      }
      return next;
    });
  }

  loadSettings(): void {
    this.loading.set(true);

    this.storeSettingsService.getSettings().subscribe({
      next: (data) => {
        this.form.patchValue({
          storeName: data.storeName,
          address: data.address,
          phone: data.phone,
          email: data.email,
          licenseNumber: data.licenseNumber,
          taxNumber: data.taxNumber,
          commercialRegister: data.commercialRegister,
          logoUrl: data.logoUrl,
          currency: data.currency,
          timezone: data.timezone,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
          largeSaleThreshold: data.largeSaleThreshold ?? 5000,
          largeExpenseThreshold: data.largeExpenseThreshold ?? 2000
        });

        const enabled = data.enabledPaymentMethods
          ? data.enabledPaymentMethods.split(',').map(m => m.trim()).filter(Boolean)
          : this.allPaymentMethods;
        this.selectedPaymentMethods.set(new Set(enabled));

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'SETTINGS.LOAD_ERROR');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.loading.set(true);
    const request: StoreSettingsRequest = {
      ...this.form.value,
      enabledPaymentMethods: Array.from(this.selectedPaymentMethods()).join(',')
    };

    this.storeSettingsService.updateSettings(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.currencyService.setCode(request.currency || 'EGP');
        this.authService.updateStoreName(request.storeName);
        this.errorHandler.showSuccess('SETTINGS.SAVE_SUCCESS');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'SETTINGS.SAVE_ERROR');
      }
    });
  }

  onCancel(): void {
    this.loadSettings();
    this.errorHandler.showSuccess('COMMON.RESET');
  }
}
