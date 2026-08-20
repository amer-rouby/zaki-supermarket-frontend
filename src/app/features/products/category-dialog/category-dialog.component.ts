import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../../shared/material.module';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryRequest } from '../../../core/models/category';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: "./category-dialog.component.html",
  styleUrl: "./category-dialog.component.scss"
})
export class CategoryDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly categoryService = inject(CategoryService);
  private readonly errorHandler = inject(ErrorHandlerService);
  readonly data = inject(MAT_DIALOG_DATA);

  readonly loading = signal(false);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    icon: ['category'],
    color: ['#667eea'],
    isActive: [true]
  });

  constructor() {
    if (this.data?.category) {
      this.form.patchValue({
        name: this.data.category.name,
        description: this.data.category.description,
        icon: this.data.category.icon,
        color: this.data.category.color,
        isActive: this.data.category.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    const formValue = this.form.value;

    const request: CategoryRequest = {
      name: formValue.name,
      nameAr: formValue.name,
      nameEn: formValue.name,
      description: formValue.description,
      icon: formValue.icon,
      color: formValue.color,
      isActive: formValue.isActive,
      storeId: this.data?.storeId || 1
    };

    const operation = this.data?.category
      ? this.categoryService.updateCategory(this.data.category.id, request)
      : this.categoryService.createCategory(request);

    operation.subscribe({
      next: (result) => {
        this.loading.set(false);
        const successKey = this.data?.category ? 'CATEGORIES.UPDATE_SUCCESS' : 'CATEGORIES.ADD_SUCCESS';
        this.errorHandler.showSuccess(successKey);
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.loading.set(false);
        const errorKey = this.data?.category ? 'CATEGORIES.UPDATE_ERROR' : 'CATEGORIES.ADD_ERROR';
        this.errorHandler.handleHttpError(error, errorKey);
        console.error('Category error:', error);
      }
    });
  }
}
