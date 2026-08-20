import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category';
import { MaterialModule } from '../../../shared/material.module';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ProductDetailsDialogComponent } from '../product-details-dialog/product-details-dialog.component';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { TableLoadingComponent } from '../../../shared/components/table-loading/table-loading.component';

const SEARCH_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, MaterialModule, FormsModule, PageHeaderComponent, SearchableSelectComponent, TableLoadingComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly selectedCategory = signal('all');
  readonly categoryOptions = signal<Category[]>([]);
  readonly categoryValueFn = (c: Category) => c.name;
  readonly categoryLabelFn = (c: Category) => c.nameAr || c.name;
  readonly categorySearchFn = (c: Category, q: string) =>
    (c.nameAr || '').toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['name', 'barcode', 'category', 'stock', 'price', 'actions'];

  readonly hasProducts = computed(() => !this.loading() && this.products().length > 0);
  readonly isEmpty = computed(() => !this.loading() && this.products().length === 0);
  readonly hasPagination = computed(() => this.totalElements() > this.size());

  private readonly searchInput$ = new Subject<string>();

  ngOnInit(): void {
    this.loadCategoryOptions();

    this.searchInput$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page.set(0);
      this.fetchProducts();
    });

    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q');
      if (q) {
        this.searchQuery.set(q);
      }
      this.fetchProducts();
    });
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }

  private loadCategoryOptions(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (data) => this.categoryOptions.set(data),
      error: () => {}
    });
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.productService.getProductsPaged(
      this.page(), this.size(), this.searchQuery(), this.selectedCategory()
    ).subscribe({
      next: (response) => {
        this.products.set(response.content || []);
        this.totalElements.set(response.totalElements || 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorHandler.showError('PRODUCTS.LOAD_ERROR');
      }
    });
  }

  onSearchInput(): void {
    this.searchInput$.next(this.searchQuery());
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    this.fetchProducts();
  }

  filterByCategory(): void {
    this.page.set(0);
    this.fetchProducts();
  }

  onCategorySelected(selection: Category | string): void {
    this.selectedCategory.set(typeof selection === 'string' ? selection : selection.name);
    this.filterByCategory();
  }

  clearCategoryFilter(): void {
    this.onCategorySelected('all');
  }

  viewDetails(product: Product): void {
    this.dialog.open(ProductDetailsDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { product }
    });
  }

  onDelete(product: Product): void {
    this.confirmDialog
      .confirmDelete('PRODUCTS.DELETE_CONFIRM', { name: product.name })
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.deleteProduct(product.id).subscribe({
            next: () => {
              this.fetchProducts();
              this.errorHandler.showSuccess('PRODUCTS.DELETE_SUCCESS');
            },
            error: () => this.errorHandler.showError('COMMON.ERROR')
          });
        }
      });
  }

  getStockColor(stock: number): 'primary' | 'accent' | 'warn' {
    if (stock <= 10) return 'warn';
    if (stock <= 20) return 'accent';
    return 'primary';
  }

  getStockStatus(stock: number): string {
    if (stock <= 10) return this.translate.instant('PRODUCTS.LOW_STOCK');
    if (stock <= 20) return this.translate.instant('PRODUCTS.AVERAGE_STOCK');
    return this.translate.instant('PRODUCTS.GOOD_STOCK');
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.page.set(0);
    this.fetchProducts();
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  getCurrencySuffix(): string {
    return this.currencyService.getSuffix(this.languageService.getCurrentLanguage());
  }

  translateCategory(key: string): string {
    return this.translate.instant(key);
  }
}
