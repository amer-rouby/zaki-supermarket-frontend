import { AfterViewInit, Component, Inject, OnInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '../../material.module';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MaterialModule],
  templateUrl: "./confirm-dialog.component.html",
  styleUrl: "./confirm-dialog.component.scss"
})
export class ConfirmDialogComponent implements OnInit, AfterViewInit {
  private audioService = inject(AudioService);

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.audioService.playSound('dialogOpen', 1.0);
    }, 200);
  }

  onConfirm(): void {
    this.audioService.playSound('confirm', 1.0);
    setTimeout(() => this.dialogRef.close(true), 150);
  }

  onCancel(): void {
    this.audioService.playSound('cancel', 1.0);
    setTimeout(() => this.dialogRef.close(false), 150);
  }
}
