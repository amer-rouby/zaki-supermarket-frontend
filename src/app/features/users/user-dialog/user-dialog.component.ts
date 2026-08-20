import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { UserService } from '../../../core/services/user.service';
import { UserRequest, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl:'./user-dialog.component.scss'
})
export class UserDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserDialogComponent>);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly userService = inject(UserService);
  readonly data = inject(MAT_DIALOG_DATA);

  readonly loading = signal(false);

  readonly userRoles = [
    { value: UserRole.ADMIN, label: 'USERS.ADMIN' },
    { value: UserRole.PHARMACIST, label: 'USERS.PHARMACIST' },
    { value: UserRole.MANAGER, label: 'USERS.MANAGER' },
    { value: UserRole.VIEWER, label: 'USERS.VIEWER' }
  ];

  readonly form: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', this.data?.mode === 'edit' ? [] : [Validators.required, Validators.minLength(6)]],
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    role: [UserRole.PHARMACIST, Validators.required],
    isActive: [true]
  });

  constructor() {
    if (this.data?.user) {
      this.form.patchValue({
        username: this.data.user.username,
        fullName: this.data.user.fullName,
        email: this.data.user.email,
        phone: this.data.user.phone,
        role: this.data.user.role,
        isActive: this.data.user.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    const formValue = this.form.value;

    const request: UserRequest = {
      username: formValue.username,
      fullName: formValue.fullName,
      email: formValue.email,
      phone: formValue.phone,
      role: formValue.role,
      storeId: this.data?.storeId || 1,
      isActive: formValue.isActive
    };

    if (formValue.password && formValue.password.trim()) {
      request.password = formValue.password;
    }

    const operation = this.data?.mode === 'edit' && this.data?.user
      ? this.userService.updateUser(this.data.user.id, request)
      : this.userService.createUser(request);

    operation.subscribe({
      next: (result) => {
        this.loading.set(false);
        const successKey = this.data?.mode === 'edit' ? 'USERS.UPDATE_SUCCESS' : 'USERS.ADD_SUCCESS';
        this.errorHandler.showSuccess(successKey);
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(error, 'USERS.ERROR');
      }
    });
  }
}
