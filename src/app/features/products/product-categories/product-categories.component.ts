import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { Category, CategoryRequest } from '../../../core/models/category';
import { CategoryDialogComponent } from '../category-dialog/category-dialog.component';

const SEARCH_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [
    FormsModule,
    MaterialModule,
    PageHeaderComponent,
  ],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.scss'
})
export class ProductCategoriesComponent implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['icon', 'name', 'description', 'isActive', 'actions'];

  readonly hasPagination = computed(() => this.totalElements() > this.size());

  private readonly searchInput$ = new Subject<string>();

  ngOnInit(): void {
    this.searchInput$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page.set(0);
      this.fetchCategories();
    });

    this.fetchCategories();
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }

  fetchCategories(): void {
    this.loading.set(true);

    this.categoryService.getCategoriesPaged(this.page(), this.size(), this.searchQuery()).subscribe({
      next: (response) => {
        this.categories.set(response.content || []);
        this.totalElements.set(response.totalElements || 0);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(error, 'CATEGORIES.LOAD_ERROR');
      }
    });
  }

  onSearchInput(): void {
    this.searchInput$.next(this.searchQuery());
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    this.fetchCategories();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.page.set(0);
    this.fetchCategories();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '450px',
      data: {
        storeId: this.authService.getStoreId(),
        mode: 'add'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategories();
      }
    });
  }

  onEdit(category: Category): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '450px',
      data: {
        category: category,
        storeId: category.storeId,
        mode: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategories();
      }
    });
  }

  onDelete(category: Category): void {
    this.confirmDialog.open({
      messageKey: 'CATEGORIES.CONFIRM_DELETE',
      messageParams: { name: category.name },
      width: '400px',
      color: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.fetchCategories();
            this.errorHandler.showSuccess('CATEGORIES.DELETE_SUCCESS');
          },
          error: (error) => {
            this.errorHandler.handleHttpError(error, 'CATEGORIES.DELETE_ERROR');
          }
        });
      }
    });
  }

  toggleActive(category: Category): void {
    const updated: CategoryRequest = {
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      storeId: category.storeId,
      isActive: !category.isActive
    };

    this.categoryService.updateCategory(category.id, updated).subscribe({
      next: (data) => {
        this.categories.update(cats =>
          cats.map(c => c.id === category.id ? data : c)
        );
        this.errorHandler.showSuccess('CATEGORIES.STATUS_UPDATED');
      },
      error: (error) => {
        this.errorHandler.handleHttpError(error, 'CATEGORIES.STATUS_ERROR');
      }
    });
  }

  getCategoryIcon(category: Category): string {
    return category.icon || 'category';
  }

  getCategoryColor(category: Category): string {
    return category.color || '#667eea';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive
      ? this.translate.instant('COMMON.ACTIVE')
      : this.translate.instant('COMMON.INACTIVE');
  }

  getStatusColor(isActive: boolean): 'primary' | 'warn' {
    return isActive ? 'primary' : 'warn';
  }
}
