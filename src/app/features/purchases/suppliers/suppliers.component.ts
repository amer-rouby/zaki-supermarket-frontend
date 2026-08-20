import { Component, inject, signal, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier } from '../../../core/models/purchase-order.model';
import { SupplierRequest } from '../../../core/models/purchase-request.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    MaterialModule,
    PageHeaderComponent,
    MatTableModule,
    MatPaginatorModule,
    ReactiveFormsModule
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent implements OnInit, AfterViewInit {
  private readonly supplierService = inject(SupplierService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly loading = signal(false);
  readonly showDialog = signal(false);
  readonly isEditMode = signal(false);
  readonly editingSupplierId = signal<number | null>(null);
  readonly supplierForm: FormGroup;

  displayedColumns: string[] = ['name', 'contactPerson', 'phone', 'email', 'city', 'status', 'actions'];
  dataSource = new MatTableDataSource<Supplier>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contactPerson: [''],
      phone: [''],
      email: ['', [Validators.email]],
      address: [''],
      city: [''],
      status: ['ACTIVE'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.supplierService.getSuppliers(0, 10).subscribe({
      next: (data) => {
        this.dataSource.data = data.content || [];
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'SUPPLIERS.LOAD_ERROR');
      }
    });
  }

  onAdd(): void {
    this.isEditMode.set(false);
    this.editingSupplierId.set(null);
    this.supplierForm.reset({ status: 'ACTIVE' });
    this.showDialog.set(true);
  }

  onEdit(supplier: Supplier): void {
    if (!supplier?.id) {
      this.errorHandler.showWarning('SUPPLIERS.INVALID_SUPPLIER');
      return;
    }

    this.isEditMode.set(true);
    this.editingSupplierId.set(supplier.id);
    this.supplierForm.patchValue({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      status: supplier.status,
      notes: supplier.notes
    });
    this.showDialog.set(true);
  }

  onDelete(supplier: Supplier): void {
    if (!supplier?.id) {
      this.errorHandler.showWarning('SUPPLIERS.INVALID_SUPPLIER');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('SUPPLIERS.DELETE'),
        message: this.translate.instant('SUPPLIERS.CONFIRM_DELETE', { name: supplier.name }),
        confirmText: this.translate.instant('COMMON.DELETE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.supplierService.deleteSupplier(supplier.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('SUPPLIERS.DELETED');
            this.loadSuppliers();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'SUPPLIERS.DELETE_ERROR')
        });
      }
    });
  }

  onToggleStatus(supplier: Supplier): void {
    if (!supplier?.id) {
      this.errorHandler.showWarning('SUPPLIERS.INVALID_SUPPLIER');
      return;
    }

    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const request: SupplierRequest = {
      ...supplier,
      status: newStatus
    };

    this.supplierService.updateSupplier(supplier.id, request).subscribe({
      next: () => {
        this.errorHandler.showSuccess('SUPPLIERS.STATUS_UPDATED');
        this.loadSuppliers();
      },
      error: (err) => this.errorHandler.handleHttpError(err, 'SUPPLIERS.STATUS_ERROR')
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.loading.set(true);
    const request: SupplierRequest = this.supplierForm.value;

    const call = this.isEditMode() && this.editingSupplierId()
      ? this.supplierService.updateSupplier(this.editingSupplierId()!, request)
      : this.supplierService.createSupplier(request);

    call.subscribe({
      next: () => {
        this.loading.set(false);
        this.showDialog.set(false);
        this.errorHandler.showSuccess(this.isEditMode() ? 'SUPPLIERS.UPDATE_SUCCESS' : 'SUPPLIERS.ADD_SUCCESS');
        this.loadSuppliers();
        this.supplierForm.reset({ status: 'ACTIVE' });
        this.editingSupplierId.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, this.isEditMode() ? 'SUPPLIERS.UPDATE_ERROR' : 'SUPPLIERS.ADD_ERROR');
      }
    });
  }

  onCancel(): void {
    this.showDialog.set(false);
    this.supplierForm.reset({ status: 'ACTIVE' });
    this.editingSupplierId.set(null);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'COMMON.ACTIVE',
      'INACTIVE': 'COMMON.INACTIVE',
      'BLOCKED': 'COMMON.BLOCKED'
    };
    return this.translate.instant(labels[status] || status);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'ACTIVE': '#10b981',
      'INACTIVE': '#6b7280',
      'BLOCKED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }
}
