import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ShareService, ShareLinkResponse } from '../../../core/services/share.service';
import { MaterialModule } from '../../material.module';

interface ShareDialogData {
  entityType: string;
  entityId: number;
  entityName?: string;
}

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    ClipboardModule
  ],
  templateUrl:"./share-dialog.component.html",
  styleUrl:"./share-dialog.component.scss"
})
export class ShareDialogComponent {
  private readonly shareService = inject(ShareService);
  private readonly snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<ShareDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ShareDialogData) { }

  loading = false;
  shareLink: ShareLinkResponse | null = null;

  ngOnInit(): void {
    this.createShareLink();
  }

  createShareLink(): void {
    this.loading = true;

    this.shareService.createShareLink({
      entityType: this.data.entityType,
      entityId: this.data.entityId,
      expiryHours: 24
    }).subscribe({
      next: (response) => {
        this.shareLink = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating share link:', error);
        this.snackBar.open('فشل إنشاء رابط المشاركة', 'إغلاق', { duration: 3000 });
        this.loading = false;
        this.dialogRef.close();
      }
    });
  }

  onCopy(): void {
    this.snackBar.open('تم نسخ الرابط', 'إغلاق', { duration: 2000 });
  }
}
