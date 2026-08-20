import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { SecuritySettingsService } from '../../../core/services/settings/security-settings.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './security-settings.component.html',
  styleUrl: './security-settings.component.scss'
})
export class SecuritySettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly securitySettingsService = inject(SecuritySettingsService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  passwordForm: FormGroup;
  securitySettings: any = null;

  readonly securityQuestions = [
    { value: 'q1', label: 'SECURITY.Q1' },
    { value: 'q2', label: 'SECURITY.Q2' },
    { value: 'q3', label: 'SECURITY.Q3' },
    { value: 'q4', label: 'SECURITY.Q4' },
    { value: 'q5', label: 'SECURITY.Q5' }
  ];

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      securityQuestion: [''],
      securityAnswer: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadSecuritySettings();
  }

  loadSecuritySettings(): void {
    this.loading.set(true);

    this.securitySettingsService.getSettings().subscribe({
      next: (data) => {
        this.securitySettings = data;
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'SECURITY.LOAD_ERROR');
      }
    });
  }

  toggleShowCurrentPassword(): void {
    this.showCurrentPassword.update(v => !v);
  }

  toggleShowNewPassword(): void {
    this.showNewPassword.update(v => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.saving.set(true);

    this.securitySettingsService.changePassword({
      oldPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
      confirmPassword: this.passwordForm.get('confirmPassword')?.value
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.passwordForm.reset();
        this.errorHandler.showSuccess('SECURITY.PASSWORD_CHANGED');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorHandler.handleHttpError(err, 'SECURITY.PASSWORD_ERROR');
      }
    });
  }

  get passwordStrength(): string {
    const password = this.passwordForm?.get('newPassword')?.value || '';

    if (!password) return '';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const strengths = ['weak', 'weak', 'fair', 'good', 'strong', 'strong'];
    return strengths[strength] || 'weak';
  }

  getPasswordStrengthWidth(): string {
    const strengthMap: Record<string, string> = {
      weak: '20%',
      fair: '40%',
      good: '70%',
      strong: '100%'
    };
    return strengthMap[this.passwordStrength] || '0%';
  }

  getPasswordStrengthColor(): string {
    const colors: Record<string, string> = {
      weak: '#ef4444',
      fair: '#f59e0b',
      good: '#3b82f6',
      strong: '#10b981'
    };
    return colors[this.passwordStrength] || '#ef4444';
  }
}
