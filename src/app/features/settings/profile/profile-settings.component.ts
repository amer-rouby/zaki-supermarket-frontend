import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { catchError, finalize, map, throwError, first } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ProfileService } from '../../../core/services/settings/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { PasswordChangeRequest, Profile, ProfileUpdateRequest } from '../../../core/models/settings/profile.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss'
})
export class ProfileSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly profileService = inject(ProfileService);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly storeContext = inject(StoreContextService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly loading = signal(false);
  readonly profile = signal<Profile | null>(null);
  readonly showPasswordForm = signal(false);
  readonly previewImageUrl = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly isDragging = signal(false);

  readonly profileForm: FormGroup;
  readonly passwordForm: FormGroup;
  readonly genders = [
    { value: 'MALE', label: 'PROFILE.MALE' },
    { value: 'FEMALE', label: 'PROFILE.FEMALE' },
    { value: 'OTHER', label: 'PROFILE.OTHER' }
  ];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  constructor() {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.maxLength(50)]],
      profileImageUrl: ['', [Validators.maxLength(255)]],
      jobTitle: ['', [Validators.maxLength(100)]],
      department: ['', [Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(100)]],
      city: ['', [Validators.maxLength(50)]],
      country: ['', [Validators.maxLength(50)]],
      bio: ['', [Validators.maxLength(500)]],
      gender: ['']
    });
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.profileForm.patchValue(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'PROFILE.LOAD_ERROR');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.isDragging.set(false); }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files?.[0]) this.handleFile(event.dataTransfer.files[0]);
  }

  private handleFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.errorHandler.showWarning('PROFILE.INVALID_FILE_TYPE');
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.errorHandler.showWarning('PROFILE.FILE_TOO_LARGE');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImageUrl.set(e.target?.result as string);
      this.selectedFile.set(file);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.previewImageUrl.set(null);
    this.selectedFile.set(null);
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }
    this.loading.set(true);
    if (this.selectedFile()) {
      this.uploadProfileImage().subscribe({
        next: (imageUrl) => this.updateProfileWithImage(imageUrl),
        error: (err) => {
          this.handleUploadError();
          this.errorHandler.handleHttpError(err, 'PROFILE.UPLOAD_ERROR');
        }
      });
    } else {
      this.updateProfile();
    }
  }

  private uploadProfileImage() {
    const file = this.selectedFile();
    if (!file) return throwError(() => new Error('No file selected'));
    this.uploading.set(true);
    this.uploadProgress.set(0);
    const formData = new FormData();
    formData.append('file', file, file.name);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': token ? `Bearer ${token}` : '' });

    return this.http.post<{ url: string }>(`${environment.apiUrl}/profile/upload-image`, formData,
      { headers, reportProgress: true, observe: 'events' }).pipe(
        map((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
          }
          if (event.type === HttpEventType.Response && event.body?.url) {
            return event.body.url;
          }
          return null;
        }),
        first(url => url !== null),
        finalize(() => {
          this.uploading.set(false);
          if (this.uploadProgress() === 100) this.uploadProgress.set(0);
        }),
        catchError((error) => {
          console.error('Upload error:', error);
          this.uploading.set(false);
          return throwError(() => error);
        })
      );
  }

  private updateProfileWithImage(imageUrl: string): void {
    const request: ProfileUpdateRequest = { ...this.profileForm.value, profileImageUrl: imageUrl };
    this.profileService.updateProfile(request).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.previewImageUrl.set(null);
        this.selectedFile.set(null);
        this.loading.set(false);
        this.errorHandler.showSuccess('PROFILE.UPDATE_SUCCESS');
      },
      error: (err) => {
        this.handleUpdateError();
        this.errorHandler.handleHttpError(err, 'PROFILE.UPDATE_ERROR');
      }
    });
  }

  private updateProfile(): void {
    const request: ProfileUpdateRequest = this.profileForm.value;
    this.profileService.updateProfile(request).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.loading.set(false);
        this.errorHandler.showSuccess('PROFILE.UPDATE_SUCCESS');
      },
      error: (err) => {
        this.handleUpdateError();
        this.errorHandler.handleHttpError(err, 'PROFILE.UPDATE_ERROR');
      }
    });
  }

  private handleUploadError(): void {
    this.loading.set(false);
    this.uploading.set(false);
  }

  private handleUpdateError(): void {
    this.loading.set(false);
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }
    this.loading.set(true);
    const request: PasswordChangeRequest = this.passwordForm.value;
    this.profileService.changePassword(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.passwordForm.reset();
        this.showPasswordForm.set(false);
        this.errorHandler.showSuccess('PROFILE.PASSWORD_CHANGED');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'PROFILE.PASSWORD_ERROR');
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm.update(v => !v);
    if (!this.showPasswordForm()) this.passwordForm.reset();
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

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'ADMIN': this.translate.instant('USERS.ADMIN'),
      'PHARMACIST': this.translate.instant('USERS.PHARMACIST'),
      'MANAGER': this.translate.instant('USERS.MANAGER'),
      'VIEWER': this.translate.instant('USERS.VIEWER')
    };
    return labels[role] || role;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getProfileImageUrl(): string {
    const imageUrl = this.profile()?.profileImageUrl;
    if (!imageUrl) return 'assets/default-avatar.png';
    if (imageUrl.startsWith('/api/') || imageUrl.startsWith('/')) {
      return this.storeContext.resolveAssetUrl(imageUrl);
    }
    return imageUrl;
  }
}
