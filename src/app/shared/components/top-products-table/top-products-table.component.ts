import { Component, Input, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../material.module';
import { LanguageService } from '../../../core/services/language.service';
import { formatCurrency } from '../../../core/utils/format.util';
import { TopProductTableItem } from '../../models/top-product-table.model';

@Component({
  selector: 'app-top-products-table',
  standalone: true,
  imports: [MaterialModule, TranslateModule],
  templateUrl: './top-products-table.component.html',
  styleUrl: './top-products-table.component.scss'
})
export class TopProductsTableComponent {
  private readonly languageService = inject(LanguageService);

  @Input({ required: true }) products: TopProductTableItem[] = [];
  @Input() showRank = true;
  @Input() useChips = false;

  readonly columns = ['rank', 'productName', 'quantitySold', 'totalRevenue'];

  formatMoney(amount: number): string {
    return formatCurrency(amount, this.languageService.getCurrentLanguage());
  }

  rankFor(item: TopProductTableItem, index: number): number {
    return item.rank ?? index + 1;
  }
}
