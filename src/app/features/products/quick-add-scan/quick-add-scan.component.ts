import { Component, inject, signal, computed, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { StockBatchService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { LanguageService } from '../../../core/services/language.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category';
import { MaterialModule } from '../../../shared/material.module';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

interface SessionEntry {
  barcode: string;
  name: string;
  kind: 'new' | 'restock';
  quantity: number | null;
  time: string;
}

function defaultExpiry(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 24);
  return d;
}

@Component({
  selector: 'app-quick-add-scan',
  standalone: true,
  imports: [FormsModule, MaterialModule, PageHeaderComponent, SearchableSelectComponent],
  templateUrl: './quick-add-scan.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './quick-add-scan.component.scss'
})
export class QuickAddScanComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly stockService = inject(StockBatchService);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly translate = inject(TranslateService);
  private readonly currencyService = inject(CurrencyService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  readonly barcodeValue = signal('');
  readonly allProducts = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly categoryValueFn = (c: Category) => c.name;
  readonly categoryLabelFn = (c: Category) => c.nameAr || c.name;
  readonly categorySearchFn = (c: Category, q: string) =>
    (c.nameAr || '').toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  readonly matchedProduct = signal<Product | null>(null);
  readonly mode = signal<'idle' | 'existing' | 'new'>('idle');
  readonly saving = signal(false);
  readonly sessionLog = signal<SessionEntry[]>([]);

  readonly unitTypes = [
    { value: 'PIECE', label: 'PRODUCTS.UNIT_PIECE' },
    { value: 'BOX', label: 'PRODUCTS.UNIT_BOX' },
    { value: 'BOTTLE', label: 'PRODUCTS.UNIT_BOTTLE' },
    { value: 'BAG', label: 'PRODUCTS.UNIT_BAG' },
    { value: 'PACK', label: 'PRODUCTS.UNIT_PACK' },
    { value: 'KG', label: 'PRODUCTS.UNIT_KG' },
    { value: 'GRAM', label: 'PRODUCTS.UNIT_GRAM' },
    { value: 'LITER', label: 'PRODUCTS.UNIT_LITER' },
    { value: 'CARTON', label: 'PRODUCTS.UNIT_CARTON' }
  ];

  // new-product mini form
  readonly newName = signal('');
  readonly newUnitType = signal('PIECE');
  readonly newSellPrice = signal<number | null>(null);
  readonly newBuyPrice = signal<number | null>(null);
  readonly newCategory = signal('');
  readonly newQuantity = signal<number | null>(null);
  readonly newExpiryDate = signal<Date | null>(defaultExpiry());

  // restock mini form (existing product)
  readonly restockQuantity = signal<number | null>(null);
  readonly restockExpiryDate = signal<Date | null>(defaultExpiry());

  readonly sessionCount = computed(() => this.sessionLog().length);

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.focusBarcode();
  }

  private focusBarcode(): void {
    setTimeout(() => this.barcodeInputRef?.nativeElement.focus(), 0);
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response: any) => this.allProducts.set(response.data || []),
      error: () => {}
    });
  }

  private loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => {}
    });
  }

  onScan(): void {
    const code = this.barcodeValue().trim();
    if (!code) return;

    const product = this.allProducts().find(p => p.barcode?.trim() === code);
    if (product) {
      this.matchedProduct.set(product);
      this.mode.set('existing');
      this.restockQuantity.set(null);
      this.restockExpiryDate.set(defaultExpiry());
    } else {
      this.matchedProduct.set(null);
      this.mode.set('new');
      this.newName.set('');
      this.newUnitType.set('PIECE');
      this.newSellPrice.set(null);
      this.newBuyPrice.set(null);
      this.newCategory.set('');
      this.newQuantity.set(null);
      this.newExpiryDate.set(defaultExpiry());
    }
  }

  cancelEntry(): void {
    this.mode.set('idle');
    this.matchedProduct.set(null);
    this.barcodeValue.set('');
    this.focusBarcode();
  }

  saveNewProduct(): void {
    if (!this.newName().trim()) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED', {
        params: { field: this.translate.instant('PRODUCTS.NAME') }
      });
      return;
    }
    if (!this.newSellPrice() || this.newSellPrice()! <= 0) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED', {
        params: { field: this.translate.instant('PRODUCTS.SELL_PRICE') }
      });
      return;
    }
    if (this.newQuantity() && this.newQuantity()! > 0 && !this.newExpiryDate()) {
      this.errorHandler.showWarning('PRODUCTS.EXPIRY_DATE_REQUIRED_WITH_STOCK');
      return;
    }

    const barcode = this.barcodeValue().trim();
    this.saving.set(true);

    this.productService.createProduct({
      name: this.newName().trim(),
      barcode,
      unitType: this.newUnitType(),
      category: this.newCategory() || undefined,
      sellPrice: this.newSellPrice()!,
      buyPrice: this.newBuyPrice() || undefined,
      minStockLevel: 10,
      initialStock: this.newQuantity() || undefined,
      expiryDate: this.toLocalDateString(this.newExpiryDate())
    }).subscribe({
      next: (response: any) => {
        this.saving.set(false);
        const created: Product = response.data;
        this.allProducts.update(list => [...list, created]);
        this.logEntry(barcode, this.newName().trim(), 'new', this.newQuantity());
        this.errorHandler.showSuccess('PRODUCTS.ADD_SUCCESS');
        this.resetAfterSave();
      },
      error: (error: any) => {
        this.saving.set(false);
        this.errorHandler.handleHttpError(error, error.error?.message || 'COMMON.ERROR');
      }
    });
  }

  saveRestock(): void {
    const product = this.matchedProduct();
    if (!product) return;

    const quantity = this.restockQuantity();
    if (!quantity || quantity <= 0) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED', {
        params: { field: this.translate.instant('PRODUCTS.INITIAL_QUANTITY') }
      });
      return;
    }
    if (!this.restockExpiryDate()) {
      this.errorHandler.showWarning('PRODUCTS.EXPIRY_DATE_REQUIRED_WITH_STOCK');
      return;
    }

    const storeId = this.authService.getStoreId() || 1;
    this.saving.set(true);

    this.stockService.createBatch({
      productId: product.id,
      batchNumber: `SCAN-${product.id}-${Date.now()}`,
      quantityInitial: quantity,
      quantityCurrent: quantity,
      expiryDate: this.toLocalDateString(this.restockExpiryDate())!,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      location: 'Shelf-1',
      status: 'ACTIVE'
    }, storeId).subscribe({
      next: () => {
        this.saving.set(false);
        this.allProducts.update(list => list.map(p =>
          p.id === product.id ? { ...p, totalStock: (p.totalStock || 0) + quantity } : p
        ));
        this.logEntry(product.barcode || '', product.name, 'restock', quantity);
        this.errorHandler.showSuccess('STOCK.SUCCESS_ADD');
        this.resetAfterSave();
      },
      error: (error: any) => {
        this.saving.set(false);
        this.errorHandler.handleHttpError(error, error.error?.message || 'COMMON.ERROR');
      }
    });
  }

  skipRestock(): void {
    const product = this.matchedProduct();
    if (product) {
      this.logEntry(product.barcode || '', product.name, 'restock', null);
    }
    this.resetAfterSave();
  }

  private resetAfterSave(): void {
    this.mode.set('idle');
    this.matchedProduct.set(null);
    this.barcodeValue.set('');
    this.focusBarcode();
  }

  private logEntry(barcode: string, name: string, kind: 'new' | 'restock', quantity: number | null): void {
    this.sessionLog.update(log => [{
      barcode, name, kind, quantity,
      time: new Date().toLocaleTimeString(this.languageService.getCurrentLanguage() === 'ar' ? 'ar-EG' : 'en-US')
    }, ...log]);
  }

  private toLocalDateString(date: Date | null): string | undefined {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getCategoryName(category: Category): string {
    return category.name;
  }

  onCategorySelected(category: Category): void {
    this.newCategory.set(category.name);
  }

  clearCategorySelection(): void {
    this.newCategory.set('');
  }

  translateUnitType(key: string): string {
    return this.translate.instant(key);
  }

  getCurrencySuffix(): string {
    return this.currencyService.getSuffix(this.languageService.getCurrentLanguage());
  }

  finishSession(): void {
    this.router.navigate(['/products']);
  }
}
