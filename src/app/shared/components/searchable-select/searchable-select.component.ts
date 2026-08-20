import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface SearchableSelectPrependOption {
  value: any;
  label: string;
}

/**
 * Shared searchable dropdown for picking one item out of a long, already-loaded
 * list (categories, products, suppliers, ...). Wraps mat-autocomplete so callers
 * don't each hand-roll the same search-text signal + filtered-list + clear-button
 * plumbing. Not meant for rich multi-line option content or async/paginated
 * sources - those stay as bespoke templates where the extra flexibility is worth it.
 */
@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './searchable-select.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './searchable-select.component.scss'
})
export class SearchableSelectComponent<T = any> implements OnChanges {
  @Input() options: T[] = [];
  @Input() valueFn: (item: T) => any = (item: any) => item?.id;
  @Input() labelFn: (item: T) => string = (item: any) => item?.name ?? '';
  @Input() searchFn?: (item: T, query: string) => boolean;
  @Input() value: any = null;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() noResultsText = '';
  @Input() prependOption: SearchableSelectPrependOption | null = null;
  @Input() maxResults = 20;
  @Input() prefixIcon = '';
  @Input() emptyOptionsText = '';
  @Input() errorText = '';

  @Output() selected = new EventEmitter<T | any>();
  @Output() cleared = new EventEmitter<void>();

  searchText = '';
  filteredOptions: T[] = [];

  get isEmptyOptions(): boolean {
    return !this.loading && this.options.length === 0 && !!this.emptyOptionsText;
  }

  get effectivePlaceholder(): string {
    return this.isEmptyOptions ? this.emptyOptionsText : this.placeholder;
  }

  get effectiveDisabled(): boolean {
    return this.disabled || this.loading || this.isEmptyOptions;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['value'] || changes['prependOption']) {
      this.syncDisplayText();
    }
    if (changes['options'] || changes['searchFn'] || changes['maxResults']) {
      this.applyFilter();
    }
  }

  onSearchTextChange(): void {
    this.applyFilter();
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedValue = event.option.value;

    if (this.prependOption && selectedValue === this.prependOption.value) {
      this.searchText = '';
      this.applyFilter();
      this.selected.emit(selectedValue);
      return;
    }

    const item = this.options.find(o => this.valueFn(o) === selectedValue);
    if (item) {
      this.searchText = this.labelFn(item);
      this.selected.emit(item);
    }
  }

  onClear(): void {
    this.searchText = '';
    this.applyFilter();
    this.cleared.emit();
  }

  private applyFilter(): void {
    const query = String(this.searchText ?? '').trim().toLowerCase();
    let opts = this.options;

    if (query) {
      opts = this.searchFn
        ? opts.filter(o => this.searchFn!(o, query))
        : opts.filter(o => this.labelFn(o).toLowerCase().includes(query));
    }

    this.filteredOptions = opts.slice(0, this.maxResults);
  }

  private syncDisplayText(): void {
    if (this.value === null || this.value === undefined || this.value === '') {
      this.searchText = '';
      return;
    }

    if (this.prependOption && this.value === this.prependOption.value) {
      this.searchText = '';
      return;
    }

    const match = this.options.find(o => this.valueFn(o) === this.value);
    if (match) {
      this.searchText = this.labelFn(match);
    }
  }
}
