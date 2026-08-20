import { Component, inject, signal, computed, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProductRequest } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category';
import { MaterialModule } from '../../../shared/material.module';
import { LanguageService } from '../../../core/services/language.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule, MaterialModule, PageHeaderComponent, SearchableSelectComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly currencyService = inject(CurrencyService);

  readonly translate = inject(TranslateService);
  readonly languageService = inject(LanguageService);

  readonly product = signal<ProductRequest>({
    name: '',
    barcode: '',
    category: '',
    unitType: 'PIECE',
    minStockLevel: 10,
    sellPrice: 0,
    buyPrice: 0
  });

  readonly extraFields = signal({
    manufacturer: '',
    description: '',
    storageConditions: ''
  });

  readonly loading = signal(false);
  readonly categoriesLoading = signal(false);
  readonly isEditMode = signal(false);
  readonly productId = signal<number | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly categoryValueFn = (c: Category) => c.name;
  readonly categoryLabelFn = (c: Category) => c.nameAr || c.name;
  readonly categorySearchFn = (c: Category, q: string) =>
    (c.nameAr || '').toLowerCase().includes(q) || c.name.toLowerCase().includes(q);

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

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'PRODUCTS.EDIT' : 'PRODUCTS.ADD_NEW'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode() ? 'PRODUCTS.EDIT_SUBTITLE' : 'PRODUCTS.ADD_SUBTITLE'
  );

  ngOnInit(): void {
    this.loadCategories();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.productId.set(+params['id']);
        this.loadProduct();
      } else {
        this.generateUniqueBarcode();
      }
    });

    // Reload categories when language changes
    this.languageService.currentLang$.subscribe(() => {
      this.loadCategories();
    });
  }

  ngAfterViewInit(): void {
    if (!this.isEditMode()) {
      setTimeout(() => this.barcodeInputRef?.nativeElement.focus(), 0);
    }
  }

  loadCategories(): void {
    this.categoriesLoading.set(true);

    this.categoryService.getActiveCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.categoriesLoading.set(false);
      },
      error: (error) => {
        this.categoriesLoading.set(false);
        this.errorHandler.handleHttpError(error, 'CATEGORIES.LOAD_ERROR');
      }
    });
  }

  onCategorySelected(category: Category): void {
    this.product.update(p => ({ ...p, category: category.name }));
  }

  clearCategorySelection(): void {
    this.product.update(p => ({ ...p, category: '' }));
  }

  generateUniqueBarcode(): void {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.product.update(p => ({ ...p, barcode: `PRD-${timestamp}-${random}` }));
  }

  loadProduct(): void {
    const id = this.productId();
    if (!id) return;

    this.loading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (response: any) => {
        const data = response.data;
        this.product.set({
          name: data.name || '',
          barcode: data.barcode || '',
          category: data.category || '',
          unitType: data.unitType || 'PIECE',
          minStockLevel: data.minStockLevel || 10,
          sellPrice: data.sellPrice || 0,
          buyPrice: data.buyPrice || 0
        });

        const extra = data.extraAttributes || {};
        this.extraFields.set({
          manufacturer: extra['manufacturer'] || '',
          description: extra['description'] || '',
          storageConditions: extra['storageConditions'] || ''
        });

        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(error, 'PRODUCTS.LOAD_ERROR');
        this.router.navigate(['/products']);
      }
    });
  }

  onSubmit(): void {
    const p = this.product();

    if (!p.name?.trim()) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED', {
        params: { field: this.translate.instant('PRODUCTS.NAME') }
      });
      return;
    }

    if (!p.sellPrice || p.sellPrice <= 0) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED', {
        params: { field: this.translate.instant('PRODUCTS.SELL_PRICE') }
      });
      return;
    }

    if (!this.isEditMode() && p.initialStock && p.initialStock > 0 && !p.expiryDate) {
      this.errorHandler.showWarning('PRODUCTS.EXPIRY_DATE_REQUIRED_WITH_STOCK');
      return;
    }

    const ef = this.extraFields();
    const extraAttributes: Record<string, any> = {};
    if (ef.manufacturer.trim()) extraAttributes['manufacturer'] = ef.manufacturer.trim();
    if (ef.description.trim()) extraAttributes['description'] = ef.description.trim();
    if (ef.storageConditions.trim()) extraAttributes['storageConditions'] = ef.storageConditions.trim();

    const payload: ProductRequest = {
      ...p,
      extraAttributes: Object.keys(extraAttributes).length ? extraAttributes : undefined,
      initialStock: this.isEditMode() ? undefined : p.initialStock,
      expiryDate: this.isEditMode() ? undefined : this.toLocalDateString(p.expiryDate)
    };

    this.loading.set(true);

    const request$ = this.isEditMode() && this.productId()
      ? this.productService.updateProduct(this.productId()!, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: (response: any) => {
        this.loading.set(false);
        const msg = response.message || (this.isEditMode() ? 'PRODUCTS.UPDATE_SUCCESS' : 'PRODUCTS.ADD_SUCCESS');
        this.errorHandler.showSuccess(msg);
        this.router.navigate(['/products']);
      },
      error: (error: any) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(error, error.error?.message || 'COMMON.ERROR');
      }
    });
  }


  onCancel(): void {
    this.router.navigate(['/products']);
  }

  regenerateBarcode(): void {
    this.generateUniqueBarcode();
    this.errorHandler.showSuccess('PRODUCTS.BARCODE_REGENERATED');
  }

  private toLocalDateString(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  isArabic(): boolean {
    return this.languageService.getCurrentLanguage() === 'ar';
  }

  getCurrencySuffix(): string {
    return this.currencyService.getSuffix(this.languageService.getCurrentLanguage());
  }

  getCategoryName(category: Category): string {
    const currentLang = this.languageService.getCurrentLanguage();

    // Bidirectional mapping: English <-> Arabic <-> Translation Key
    const categoryKeyMap: Record<string, string> = {
      // English names
      'Dairy': 'CATEGORIES.DAIRY',
      'Bakery': 'CATEGORIES.BAKERY',
      'Grains': 'CATEGORIES.GRAINS',
      'Cooking Oil': 'CATEGORIES.COOKING_OIL',
      'Grocery': 'CATEGORIES.GROCERY',
      'Condiments': 'CATEGORIES.CONDIMENTS',
      'Household': 'CATEGORIES.HOUSEHOLD',
      'Beverages': 'CATEGORIES.BEVERAGES',
      'Meat': 'CATEGORIES.MEAT',
      'Other': 'CATEGORIES.OTHER',
      // Arabic names
      'ألبان': 'CATEGORIES.DAIRY',
      'مخبوزات': 'CATEGORIES.BAKERY',
      'حبوب': 'CATEGORIES.GRAINS',
      'زيوت الطهي': 'CATEGORIES.COOKING_OIL',
      'بقالة': 'CATEGORIES.GROCERY',
      'توابل وصلصات': 'CATEGORIES.CONDIMENTS',
      'مستلزمات منزلية': 'CATEGORIES.HOUSEHOLD',
      'مشروبات': 'CATEGORIES.BEVERAGES',
      'لحوم': 'CATEGORIES.MEAT',
      'أخرى': 'CATEGORIES.OTHER'
    };

    const translationKey = categoryKeyMap[category.name];
    if (translationKey) {
      // Always return the translation for the current language
      const translated = this.translate.instant(translationKey);
      // If translation exists and is different from the key, use it
      if (translated && translated !== translationKey) {
        return translated;
      }
    }

    // If no translation found, return the original name
    return category.name;
  }

  translateUnitType(key: string): string {
    return this.translate.instant(key);
  }
}
