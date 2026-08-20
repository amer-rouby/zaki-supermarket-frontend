import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BackupService } from '../../../core/services/settings/backup.service';
import { Backup } from '../../../core/models/settings/Backup.model';

@Component({
  selector: 'app-backup-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './backup-settings.component.html',
  styleUrl: './backup-settings.component.scss'
})
export class BackupSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly backupService = inject(BackupService);
  private readonly errorHandler = inject(ErrorHandlerService);

  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly backups = signal<Backup[]>([]);

  backupForm: FormGroup;
  displayedColumns = ['backupName', 'backupType', 'fileSize', 'status', 'createdAt', 'actions'];

  constructor() {
    this.backupForm = this.fb.group({
      backupName: ['', [Validators.required, Validators.minLength(3)]],
      backupType: ['FULL', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadBackups();
  }

  loadBackups(): void {
    this.loading.set(true);

    this.backupService.getBackups().subscribe({
      next: (data) => {
        this.backups.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'BACKUP.LOAD_ERROR');
      }
    });
  }

  onCreateBackup(): void {
    if (this.backupForm.invalid) {
      this.errorHandler.showWarning('VALIDATION.REQUIRED');
      return;
    }

    this.creating.set(true);

    this.backupService.createBackup(this.backupForm.value).subscribe({
      next: () => {
        this.creating.set(false);
        this.backupForm.reset({
          backupType: 'FULL'
        });
        this.loadBackups();
        this.errorHandler.showSuccess('BACKUP.CREATE_SUCCESS');
      },
      error: (err) => {
        this.creating.set(false);
        this.errorHandler.handleHttpError(err, 'BACKUP.CREATE_ERROR');
      }
    });
  }

  onDeleteBackup(backup: Backup): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('BACKUP.CONFIRM_DELETE_TITLE'),
        message: this.translate.instant('BACKUP.CONFIRM_DELETE', { name: backup.backupName }),
        confirmText: this.translate.instant('COMMON.DELETE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.backupService.deleteBackup(backup.id).subscribe({
          next: () => {
            this.backups.update(backups => backups.filter(b => b.id !== backup.id));
            this.errorHandler.showSuccess('BACKUP.DELETE_SUCCESS');
          },
          error: (err) => {
            this.errorHandler.handleHttpError(err, 'BACKUP.DELETE_ERROR');
          }
        });
      }
    });
  }

  onDownloadBackup(backup: Backup): void {
    this.backupService.downloadBackup(backup.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${backup.backupName}.sql`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.errorHandler.showSuccess('BACKUP.DOWNLOAD_SUCCESS');
      },
      error: (err) => {
        this.errorHandler.handleHttpError(err, 'BACKUP.DOWNLOAD_ERROR');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ar-EG');
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'COMPLETED': '#10b981',
      'PENDING': '#f59e0b',
      'FAILED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'COMPLETED': 'BACKUP.STATUS.COMPLETED',
      'PENDING': 'BACKUP.STATUS.PENDING',
      'FAILED': 'BACKUP.STATUS.FAILED'
    };
    return this.translate.instant(labels[status] || status);
  }
}
