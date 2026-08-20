import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, startWith } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductService } from '../../../core/services/product.service';
import { Supplier } from '../../../core/models/purchase-order.model';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [
    MaterialModule,
    PageHeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SearchableSelectComponent
  ],
  templateUrl: './purchase-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './purchase-form.component.scss'
})
export class PurchaseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly purchaseService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly loading = signal(false);
  readonly suppliers = signal<Supplier[]>([]);
  readonly supplierValueFn = (s: Supplier) => s.id;
  readonly supplierLabelFn = (s: Supplier) => s.name;
  readonly products = signal<Product[]>([]);
  readonly form: FormGroup;
  readonly isEditMode = signal(false);
  readonly orderId = signal<number | null>(null);
  readonly todayDate = signal<string>(new Date().toISOString().split('T')[0]);

  // One search box + filtered option list per item row, so each row's product
  // picker can be searched independently instead of scrolling a ~500-item list.
  readonly productSearchControls: FormControl[] = [];
  readonly filteredProductsPerRow: Observable<Product[]>[] = [];

  constructor() {
    this.form = this.fb.group({
      supplierId: [null, Validators.required],
      orderDate: [this.todayDate(), Validators.required],
      expectedDeliveryDate: [''],
      priority: ['NORMAL'],
      paymentTerms: [''],
      notes: [''],
      sourceType: ['MANUAL'],
      sourceId: [null],
      items: this.fb.array([], Validators.required)
    });
  }

  get itemsFormArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get itemsControls(): AbstractControl[] {
    return this.itemsFormArray.controls;
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.orderId.set(+id);
      this.loadOrder(+id);
    }
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (data) => {
        this.suppliers.set(data || []);
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'SUPPLIERS.LOAD_ERROR')
    });
  }

  onSupplierSelected(supplier: Supplier): void {
    this.form.patchValue({ supplierId: supplier.id });
  }

  clearSupplierSelection(): void {
    this.form.patchValue({ supplierId: null });
  }

  loadProducts(): void {
    this.productService.getProductsList().subscribe({
      next: (products) => this.products.set(products),
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'PRODUCTS.LOAD_ERROR');
        this.products.set([]);
      }
    });
  }

  loadOrder(id: number): void {
    this.loading.set(true);
    this.purchaseService.getOrder(id).subscribe({
      next: (order) => {
        this.form.patchValue(order);
        this.itemsFormArray.clear();
        order.items?.forEach(item => this.addItem(item));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'PURCHASES.LOAD_ERROR');
      }
    });
  }

  addItem(item?: any): void {
    this.itemsFormArray.push(this.fb.group({
      productId: [item?.productId || null, Validators.required],
      productName: [item?.productName || ''],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      notes: [item?.notes || '']
    }));

    const searchControl = new FormControl(item?.productName || '');
    this.productSearchControls.push(searchControl);
    this.filteredProductsPerRow.push(
      searchControl.valueChanges.pipe(
        startWith(item?.productName || ''),
        map(value => this._filterProductOptions(typeof value === 'string' ? value : ''))
      )
    );
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.productSearchControls.splice(index, 1);
    this.filteredProductsPerRow.splice(index, 1);
  }

  private _filterProductOptions(value: string): Product[] {
    const all = this.products();
    if (!value) return all.slice(0, 15);
    const filterValue = value.toLowerCase();
    return all
      .filter(p =>
        p.name.toLowerCase().includes(filterValue) ||
        p.barcode?.toLowerCase().includes(filterValue)
      )
      .slice(0, 15);
  }

  displayProductName(product: Product | string): string {
    if (!product) return '';
    return typeof product === 'string' ? product : product.name;
  }

  onProductChange(index: number, productId: number): void {
    const product = this.products().find(p => p.id === productId);
    if (product) {
      const itemGroup = this.itemsFormArray.at(index) as FormGroup;
      itemGroup.patchValue({
        productName: product.name,
        unitPrice: product.buyPrice || 0
      });
    }
  }

  onProductSelectedForRow(index: number, product: Product): void {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    itemGroup.patchValue({
      productId: product.id,
      productName: product.name,
      unitPrice: product.buyPrice || 0
    });
    this.productSearchControls[index]?.setValue(product.name, { emitEvent: false });
  }

  calculateItemTotal(itemValue: any): number {
    return (itemValue?.quantity || 0) * (itemValue?.unitPrice || 0);
  }

  get orderTotal(): number {
    return this.itemsFormArray.value.reduce((sum: number, item: any) => sum + this.calculateItemTotal(item), 0);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.loading.set(true);
    const call = this.isEditMode()
      ? this.purchaseService.updateOrder(this.orderId()!, this.form.value)
      : this.purchaseService.createOrder(this.form.value);

    call.subscribe({
      next: (order) => {
        this.loading.set(false);
        const successKey = this.isEditMode() ? 'PURCHASES.UPDATE_SUCCESS' : 'PURCHASES.CREATE_SUCCESS';
        this.errorHandler.showSuccess(successKey);
        this.router.navigate(['/purchases', order.id]);
      },
      error: (err) => {
        this.loading.set(false);
        const errorKey = this.isEditMode() ? 'PURCHASES.UPDATE_ERROR' : 'PURCHASES.CREATE_ERROR';
        this.errorHandler.handleHttpError(err, errorKey);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/purchases']);
  }
}
