import { Component, inject, signal, computed, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { ProductService } from '../../../core/services/product.service';
import { SalesService } from '../../../core/services/sales.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { PaymentMethod, PaymentRequest, PaymentResponse } from '../../../core/models/payment.model';
import { MaterialModule } from '../../../shared/material.module';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { StoreSettingsService } from '../../../core/services/settings/store-settings.service';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaleRequest {
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  discountAmount: number;
  paymentMethod: string;
  customerPhone: string;
  totalAmount: number;
}

@Component({
  selector: 'app-sales-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MaterialModule, PageHeaderComponent, SearchableSelectComponent],
  templateUrl: './sales-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sales-form.component.scss'
})
export class SalesFormComponent implements OnInit, AfterViewInit {
  private readonly productService = inject(ProductService);
  private readonly salesService = inject(SalesService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly storeSettingsService = inject(StoreSettingsService);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandlerService);

  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;
  readonly barcodeValue = signal('');

  readonly displayedColumns = ['product', 'quantity', 'price', 'total', 'actions'];
  readonly cartItems = signal<CartItem[]>([]);
  readonly products = signal<Product[]>([]);
  readonly customerPhone = signal('');
  readonly paymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);
  readonly discount = signal(0);
  readonly loading = signal(false);

  readonly productValueFn = (p: Product) => p.id;
  readonly productLabelFn = (p: Product) => p.name;
  readonly productSearchFn = (p: Product, q: string) =>
    p.name.toLowerCase().includes(q) || !!p.barcode?.toLowerCase().includes(q);

  readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.totalPrice, 0)
  );

  readonly totalAmount = computed(() =>
    Math.max(0, this.subtotal() - this.discount())
  );

  readonly isCartEmpty = computed(() => this.cartItems().length === 0);
  readonly isSubmitDisabled = computed(() =>
    this.loading() || this.isCartEmpty() || this.totalAmount() <= 0
  );

  readonly PaymentMethod = PaymentMethod;
  readonly allPaymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'SALES.CASH', icon: 'payments' },
    { value: PaymentMethod.VISA, label: 'SALES.VISA', icon: 'credit_card' },
    { value: PaymentMethod.INSTAPAY, label: 'SALES.INSTAPAY', icon: 'account_balance' },
    { value: PaymentMethod.FAWRY, label: 'SALES.FAWRY', icon: 'store' },
    { value: PaymentMethod.WALLET, label: 'SALES.WALLET', icon: 'account_balance_wallet' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'SALES.BANK_TRANSFER', icon: 'transfer_within_a_station' }
  ];

  private readonly enabledPaymentMethodCodes = signal<Set<string>>(new Set(Object.values(PaymentMethod)));
  readonly paymentMethods = computed(() =>
    this.allPaymentMethodOptions.filter(m => this.enabledPaymentMethodCodes().has(m.value))
  );

  ngOnInit(): void {
    this.loadProducts();
    this.loadEnabledPaymentMethods();
  }

  ngAfterViewInit(): void {
    this.focusBarcodeInput();
  }

  private focusBarcodeInput(): void {
    setTimeout(() => this.barcodeInputRef?.nativeElement.focus(), 0);
  }

  onBarcodeScan(): void {
    const code = this.barcodeValue().trim();
    this.barcodeValue.set('');
    this.focusBarcodeInput();
    if (!code) return;

    const product = this.products().find(p => p.barcode?.trim() === code);
    if (!product) {
      this.errorHandler.showWarning('SALES.BARCODE_NOT_FOUND', { params: { code } });
      return;
    }
    this.addProductToCart(product);
  }

  private loadEnabledPaymentMethods(): void {
    this.storeSettingsService.getSettings().subscribe({
      next: (settings) => {
        if (!settings?.enabledPaymentMethods) return;

        const codes = settings.enabledPaymentMethods.split(',').map(c => c.trim()).filter(Boolean);
        if (!codes.length) return;

        this.enabledPaymentMethodCodes.set(new Set(codes));

        if (!codes.includes(this.paymentMethod())) {
          const fallback = this.paymentMethods()[0]?.value ?? PaymentMethod.CASH;
          this.paymentMethod.set(fallback);
        }
      }
    });
  }

  loadProducts(): void {
    this.productService.getProductsList().subscribe({
      next: (products) => {
        this.products.set(products.map((p) => ({ ...p, sellPrice: p.sellPrice || 0 })));
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'PRODUCTS.LOAD_ERROR')
    });
  }

  onProductSelected(product: Product): void {
    if (!product) return;
    this.addProductToCart(product);
  }

  addProductToCart(product: Product): void {
    if (product.totalStock <= 0) {
      this.errorHandler.showWarning('SALES.INSUFFICIENT_STOCK');
      return;
    }

    const unitPrice = product.sellPrice || 0;
    if (unitPrice === 0) {
      this.errorHandler.showWarning('SALES.NO_PRICE', { params: { name: product.name } });
      return;
    }

    const currentItems = this.cartItems();
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.totalStock) {
        this.errorHandler.showWarning('SALES.QUANTITY_EXCEEDED');
        return;
      }
      this.cartItems.set(currentItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      this.cartItems.set([...currentItems, {
        product,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice
      }]);
    }
  }

  removeFromCart(index: number): void {
    this.cartItems.set(this.cartItems().filter((_, i) => i !== index));
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1) {
      this.removeFromCart(this.cartItems().indexOf(item));
      return;
    }
    if (quantity > item.product.totalStock) {
      this.errorHandler.showWarning('SALES.QUANTITY_EXCEEDED');
      return;
    }
    this.cartItems.set(this.cartItems().map(cartItem =>
      cartItem.product.id === item.product.id
        ? { ...cartItem, quantity, totalPrice: quantity * cartItem.unitPrice }
        : cartItem
    ));
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.discount.set(0);
    this.customerPhone.set('');
  }

  async onSubmit(): Promise<void> {
    if (!this.validateSale()) return;

    this.loading.set(true);
    const saleRequest = this.mapCartToSaleRequest();

    try {
      if (this.paymentMethod() !== PaymentMethod.CASH) {
        const paymentResponse = await this.processPayment(saleRequest.totalAmount);

        if (paymentResponse.status === 'FAILED') {
          this.errorHandler.showError('PAYMENT.FAILED');
          this.loading.set(false);
          return;
        }

        if (paymentResponse.status === 'PENDING') {
          await this.handlePendingPayment(paymentResponse);
        }
      }

      const saleResponse = await this.createSale(saleRequest);
      this.handleSaleSuccess(saleResponse);
    } catch (error: any) {
      console.error('Sale submission error:', error);
      this.errorHandler.showError(error.message || 'SALES.CREATE_ERROR');
    } finally {
      this.loading.set(false);
    }
  }

  private async handlePendingPayment(paymentResponse: PaymentResponse): Promise<void> {
    await Swal.fire({
      icon: 'info',
      title: this.translate.instant('PAYMENTS.PENDING_TITLE'),
      text: paymentResponse.message || this.translate.instant('PAYMENTS.PENDING_MESSAGE'),
      confirmButtonText: this.translate.instant('COMMON.OK'),
      confirmButtonColor: '#f59e0b'
    });
  }

  private async processPayment(amount: number): Promise<PaymentResponse> {
    const request: PaymentRequest = {
      storeId: this.authService.getStoreId() || 1,
      amount,
      paymentMethod: this.paymentMethod(),
      customerName: '',
      customerPhone: this.customerPhone(),
      customerEmail: '',
      description: `Sale - ${new Date().toLocaleDateString('ar-EG')}`
    };

    return new Promise((resolve, reject) => {
      this.paymentService.processPayment(request).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  private async createSale(saleRequest: SaleRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.salesService.createSale(saleRequest).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  private validateSale(): boolean {
    if (this.isCartEmpty()) {
      this.errorHandler.showWarning('SALES.EMPTY_CART');
      return false;
    }
    if (this.totalAmount() <= 0) {
      this.errorHandler.showWarning('SALES.INVALID_TOTAL');
      return false;
    }
    return true;
  }

  private mapCartToSaleRequest(): SaleRequest {
    return {
      items: this.cartItems().map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      discountAmount: this.discount(),
      paymentMethod: this.paymentMethod(),
      customerPhone: this.customerPhone(),
      totalAmount: this.subtotal()
    };
  }

  private handleSaleSuccess(response: any): void {
    const invoiceNumber = response?.invoiceNumber || response?.data?.invoiceNumber || `INV-${Date.now()}`;
    const totalAmount = response?.totalAmount || this.totalAmount();

    Swal.fire({
      icon: 'success',
      title: this.translate.instant('SALES.SUCCESS_TITLE'),
      html: this.getSuccessAlertHtml(invoiceNumber, totalAmount),
      showConfirmButton: true,
      confirmButtonText: this.translate.instant('COMMON.CONTINUE'),
      confirmButtonColor: '#667eea',
      timer: 10000,
      timerProgressBar: true,
      didOpen: () => this.setupCopyFunction(),
      willClose: () => {
        if ((window as any).copyInvoiceNumber) {
          delete (window as any).copyInvoiceNumber;
        }
      }
    }).then(() => {
      this.finalizeSale();
    });
  }

  private getSuccessAlertHtml(invoiceNumber: string, totalAmount: number): string {
    return `
    <div style="text-align: center; padding: 10px;">
      <div style="margin-bottom: 15px;">
        <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
          ${this.translate.instant('SALES.INVOICE_NUMBER')}:
        </p>
        <div style="display: inline-flex; align-items: center; gap: 10px; background: #f8f9fa; padding: 10px 20px; border-radius: 8px; border: 2px solid #667eea;">
          <strong style="color: #667eea; font-size: 20px; font-family: monospace;">${invoiceNumber}</strong>
          <button id="copyInvoiceBtn" onclick="copyInvoiceNumber('${invoiceNumber}')"
                  style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 1.5a.5.5 0 0 1 .5.5v1h6v-1a.5.5 0 0 1 1 0v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h1v-1a.5.5 0 0 1 .5-.5z"/>
            </svg>
          </button>
        </div>
        <p id="copyMessage" style="font-size: 12px; color: #10b981; margin-top: 8px; opacity: 0; transition: opacity 0.3s;"></p>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef;">
        <p style="font-size: 14px; color: #666; margin-bottom: 5px;">
          ${this.translate.instant('SALES.TOTAL_AMOUNT')}:
        </p>
        <strong style="color: #10b981; font-size: 22px;">${this.formatCurrency(totalAmount)}</strong>
      </div>
      <div style="margin-top: 10px; font-size: 13px; color: #667eea;">
        <strong>${this.getPaymentMethodLabel(this.paymentMethod())}</strong>
      </div>
    </div>`;
  }

  private setupCopyFunction(): void {
    (window as any).copyInvoiceNumber = (number: string) => {
      navigator.clipboard.writeText(number).then(() => {
        const messageEl = document.getElementById('copyMessage');
        const btnEl = document.getElementById('copyInvoiceBtn');
        if (messageEl && btnEl) {
          messageEl.textContent = '✅ تم النسخ بنجاح!';
          messageEl.style.opacity = '1';
          btnEl.style.background = '#10b981';
          setTimeout(() => {
            messageEl.style.opacity = '0';
            btnEl.style.background = '#667eea';
          }, 2000);
        }
      });
    };
  }

  private finalizeSale(): void {
    this.clearCart();
    this.router.navigate(['/sales/history']);
  }

  onCancel(): void {
    if (!this.isCartEmpty()) {
      Swal.fire({
        title: this.translate.instant('COMMON.CONFIRM'),
        text: this.translate.instant('SALES.CANCEL_CONFIRM'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: this.translate.instant('COMMON.YES'),
        cancelButtonText: this.translate.instant('COMMON.CANCEL')
      }).then((result) => {
        if (result.isConfirmed) this.clearCart();
      });
    }
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  getCurrencySuffix(): string {
    return this.currencyService.getSuffix(this.languageService.getCurrentLanguage());
  }

  getPaymentMethodLabel(method: string): string {
    return this.translate.instant(`PAYMENTS.${method}`);
  }

  getStockLabel(stock: number): string {
    return this.translate.instant('SALES.AVAILABLE', { count: stock });
  }
}
