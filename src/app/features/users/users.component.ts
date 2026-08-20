import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TableLoadingComponent } from '../../shared/components/table-loading/table-loading.component';
import { MaterialModule } from '../../shared/material.module';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { User, UserRequest, UserRole } from '../../core/models/user.model';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, FormsModule, EmptyStateComponent, TableLoadingComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly userService = inject(UserService);
  private readonly storeContext = inject(StoreContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly page = signal(0);
  readonly size = signal(10);

  // The backend user list/search endpoints return every matching user in one
  // array with no server-side paging support, so pagination happens here.
  readonly pagedUsers = computed(() => {
    const start = this.page() * this.size();
    return this.users().slice(start, start + this.size());
  });

  readonly hasPagination = computed(() => this.users().length > this.size());

  readonly displayedColumns = ['fullName', 'email', 'role', 'isActive', 'lastLoginAt', 'actions'];
  readonly userRoles = [
    { value: UserRole.ADMIN, label: 'USERS.ADMIN' },
    { value: UserRole.PHARMACIST, label: 'USERS.PHARMACIST' },
    { value: UserRole.MANAGER, label: 'USERS.MANAGER' },
    { value: UserRole.VIEWER, label: 'USERS.VIEWER' }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.page.set(0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'USERS.LOAD_ERROR');
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery();

    if (query.trim()) {
      this.userService.searchUsers(query).subscribe({
        next: (data) => {
          this.users.set(data);
          this.page.set(0);
        },
        error: (err) => this.errorHandler.handleHttpError(err, 'USERS.LOAD_ERROR')
      });
    } else {
      this.loadUsers();
    }
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: {
        storeId: this.storeContext.getStoreId(),
        mode: 'add'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  onEdit(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: {
        user: user,
        storeId: user.storeId,
        mode: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  onDelete(user: User): void {
    this.confirmDialog
      .confirmDelete('USERS.CONFIRM_DELETE', { name: user.fullName })
      .subscribe((confirmed) => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update(users => users.filter(u => u.id !== user.id));
            this.errorHandler.showSuccess('USERS.DELETE_SUCCESS', { params: { name: user.fullName } });
          },
          error: (err) => {
            this.errorHandler.handleHttpError(err, 'USERS.DELETE_ERROR');
          }
        });
      }
    });
  }

  toggleActive(user: User): void {
    const updated: UserRequest = {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: user.storeId,
      isActive: !user.isActive
    };

    this.userService.updateUser(user.id, updated).subscribe({
      next: (data) => {
        this.users.update(users =>
          users.map(u => u.id === user.id ? data : u)
        );
        this.errorHandler.showSuccess('USERS.STATUS_UPDATED');
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'USERS.STATUS_ERROR');
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: this.translate.instant('USERS.ADMIN'),
      [UserRole.PHARMACIST]: this.translate.instant('USERS.PHARMACIST'),
      [UserRole.MANAGER]: this.translate.instant('USERS.MANAGER'),
      [UserRole.VIEWER]: this.translate.instant('USERS.VIEWER')
    };
    return labels[role] || role;
  }

  getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
      [UserRole.ADMIN]: '#ef4444',
      [UserRole.PHARMACIST]: '#3b82f6',
      [UserRole.MANAGER]: '#f59e0b',
      [UserRole.VIEWER]: '#10b981'
    };
    return colors[role] || '#6b7280';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
