import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { LanguageService } from '../../../core/services/language.service';
import { formatCurrency as formatCurrencyAmount } from '../../../core/utils/format.util';
import { DashboardStats } from '../../../core/models/dashboard.model';
import { ZakiInsights } from '../../../core/models/dashboard.model';

export interface DailyBriefDialogData {
  stats: DashboardStats | null;
  insights: ZakiInsights | null;
}

@Component({
  selector: 'app-daily-brief-dialog',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './daily-brief-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './daily-brief-dialog.component.scss'
})
export class DailyBriefDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DailyBriefDialogComponent>);
  readonly data = inject<DailyBriefDialogData>(MAT_DIALOG_DATA);
  private readonly languageService = inject(LanguageService);

  get bestSellerName(): string | null {
    return this.data.stats?.topProducts?.[0]?.productName ?? null;
  }

  get bestSellerQuantity(): number | null {
    return this.data.stats?.topProducts?.[0]?.quantitySold ?? null;
  }

  formatCurrency(amount: number): string {
    return formatCurrencyAmount(amount, this.languageService.getCurrentLanguage());
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
