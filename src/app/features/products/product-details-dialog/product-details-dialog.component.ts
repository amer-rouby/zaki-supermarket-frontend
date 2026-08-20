import { Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MaterialModule } from '../../../shared/material.module';
import { Product } from '../../../core/models/product.model';
import { LanguageService } from '../../../core/services/language.service';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-product-details-dialog',
  standalone: true,
  imports: [MatDialogModule, MaterialModule, RouterLink],
  templateUrl: './product-details-dialog.component.html',
  styleUrl: './product-details-dialog.component.scss'
})
export class ProductDetailsDialogComponent {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly currencyService = inject(CurrencyService);

  readonly product: Product;
  readonly extra: Record<string, any>;

  constructor(
    public dialogRef: MatDialogRef<ProductDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { product: Product }
  ) {
    this.product = data.product;
    this.extra = data.product.extraAttributes || {};
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount, this.languageService.getCurrentLanguage());
  }

  get hasAdditionalInfo(): boolean {
    return !!(this.extra['description'] || this.extra['storageConditions']);
  }

  close(): void {
    this.dialogRef.close();
  }
}
