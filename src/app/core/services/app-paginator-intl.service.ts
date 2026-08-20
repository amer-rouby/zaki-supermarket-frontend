import { Injectable, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

// Angular Material's default MatPaginatorIntl is hardcoded to English and never
// reacts to app-language changes, so every mat-paginator in the app (18+ screens)
// always showed "Items per page" / "of" regardless of the selected language. One
// shared provider fixes every paginator at once instead of patching each screen.
@Injectable({ providedIn: 'root' })
export class AppPaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  constructor() {
    super();
    this.updateLabels();
    this.languageService.currentLang$.subscribe(() => {
      this.updateLabels();
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('PAGINATOR.RANGE_EMPTY', { length });
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length
      ? Math.min(startIndex + pageSize, length)
      : startIndex + pageSize;
    return this.translate.instant('PAGINATOR.RANGE', {
      start: startIndex + 1,
      end: endIndex,
      length
    });
  };

  private updateLabels(): void {
    this.itemsPerPageLabel = this.translate.instant('PAGINATOR.ITEMS_PER_PAGE');
    this.nextPageLabel = this.translate.instant('PAGINATOR.NEXT_PAGE');
    this.previousPageLabel = this.translate.instant('PAGINATOR.PREVIOUS_PAGE');
    this.firstPageLabel = this.translate.instant('PAGINATOR.FIRST_PAGE');
    this.lastPageLabel = this.translate.instant('PAGINATOR.LAST_PAGE');
  }
}
