import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerRequest } from '../../../core/models/customer.model';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { TableLoadingComponent } from '../../../shared/components/table-loading/table-loading.component';
import { CustomerStatementDialogComponent } from '../customer-statement-dialog/customer-statement-dialog.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    MaterialModule,
    PageHeaderComponent,
    MatTableModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    TableLoadingComponent
  ],
  templateUrl: './customers.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly loading = signal(false);
  readonly showDialog = signal(false);
  readonly isEditMode = signal(false);
  readonly editingCustomerId = signal<number | null>(null);
  readonly customerForm: FormGroup;

  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalElements = signal(0);

  displayedColumns: string[] = ['name', 'phone', 'email', 'creditLimit', 'currentBalance', 'status', 'actions'];
  dataSource = new MatTableDataSource<Customer>([]);

  constructor() {
    this.customerForm = this.fb.group({
      name: [''],
      phone: [''],
      email: [''],
      creditLimit: [0],
      status: ['ACTIVE'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerService.getCustomers(this.page(), this.size()).subscribe({
      next: (data) => {
        this.dataSource.data = data.content || [];
        this.totalElements.set(data.totalElements || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'CUSTOMERS.LOAD_ERROR');
      }
    });
  }

  onAdd(): void {
    this.isEditMode.set(false);
    this.editingCustomerId.set(null);
    this.customerForm.reset({ status: 'ACTIVE', creditLimit: 0 });
    this.showDialog.set(true);
  }

  onEdit(customer: Customer): void {
    this.isEditMode.set(true);
    this.editingCustomerId.set(customer.id);
    this.customerForm.patchValue({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      creditLimit: customer.creditLimit,
      status: customer.status,
      notes: customer.notes
    });
    this.showDialog.set(true);
  }

  onDelete(customer: Customer): void {
    this.confirmDialog.open({
      titleKey: 'CUSTOMERS.DELETE',
      messageKey: 'CUSTOMERS.CONFIRM_DELETE',
      messageParams: { name: customer.name },
      confirmKey: 'COMMON.DELETE',
      width: '400px',
      color: 'warn'
    }).subscribe(result => {
      if (result) {
        this.customerService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.errorHandler.showSuccess('CUSTOMERS.DELETED');
            this.loadCustomers();
          },
          error: (err) => this.errorHandler.handleHttpError(err, 'CUSTOMERS.DELETE_ERROR')
        });
      }
    });
  }

  onViewStatement(customer: Customer): void {
    this.dialog.open(CustomerStatementDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { customerId: customer.id }
    }).afterClosed().subscribe(() => this.loadCustomers());
  }

  onSubmit(): void {
    if (this.customerForm.invalid || !this.customerForm.value.name) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.loading.set(true);
    const request: CustomerRequest = this.customerForm.value;

    const call = this.isEditMode() && this.editingCustomerId()
      ? this.customerService.updateCustomer(this.editingCustomerId()!, request)
      : this.customerService.createCustomer(request);

    call.subscribe({
      next: () => {
        this.loading.set(false);
        this.showDialog.set(false);
        this.errorHandler.showSuccess(this.isEditMode() ? 'CUSTOMERS.UPDATE_SUCCESS' : 'CUSTOMERS.ADD_SUCCESS');
        this.loadCustomers();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, this.isEditMode() ? 'CUSTOMERS.UPDATE_ERROR' : 'CUSTOMERS.ADD_ERROR');
      }
    });
  }

  onCancel(): void {
    this.showDialog.set(false);
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
