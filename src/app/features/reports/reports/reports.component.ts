import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface ReportCard {
  titleKey: string;
  subtitleKey: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    PageHeaderComponent
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  readonly cols = signal(2);

  readonly reportCards = signal<ReportCard[]>([
    { titleKey: 'REPORTS.SALES_REPORTS', subtitleKey: 'REPORTS.SALES_DESC', icon: 'trending_up', route: '/reports/sales', color: '#667eea' },
    { titleKey: 'REPORTS.STOCK_REPORTS', subtitleKey: 'REPORTS.STOCK_DESC', icon: 'inventory', route: '/reports/stock', color: '#764ba2' },
    { titleKey: 'REPORTS.FINANCIAL_REPORTS', subtitleKey: 'REPORTS.FINANCIAL_DESC', icon: 'account_balance', route: '/reports/financial', color: '#f093fb' },
    { titleKey: 'REPORTS.EXPIRY_REPORTS', subtitleKey: 'REPORTS.EXPIRY_DESC', icon: 'event_busy', route: '/reports/expiry', color: '#f5576c' },
    { titleKey: 'REPORTS.PROFIT_REPORTS', subtitleKey: 'REPORTS.PROFIT_DESC', icon: 'paid', route: '/reports/profit', color: '#4facfe' },
    { titleKey: 'REPORTS.CUSTOMER_REPORTS', subtitleKey: 'REPORTS.CUSTOMER_DESC', icon: 'people', route: '/reports/customers', color: '#43e97b' }
  ]);

  constructor() {
    this.updateCols();
    window.addEventListener('resize', () => this.updateCols());
  }

  private updateCols(): void {
    const width = window.innerWidth;
    if (width < 768) {
      this.cols.set(1);
    } else if (width < 1024) {
      this.cols.set(2);
    } else {
      this.cols.set(3);
    }
  }

  getTitle(key: string): string {
    const titles: Record<string, string> = {
      'REPORTS.SALES_REPORTS': 'تقارير المبيعات',
      'REPORTS.STOCK_REPORTS': 'تقارير المخزون',
      'REPORTS.FINANCIAL_REPORTS': 'التقارير المالية',
      'REPORTS.EXPIRY_REPORTS': 'تقارير الصلاحية',
      'REPORTS.PROFIT_REPORTS': 'تقارير الأرباح',
      'REPORTS.CUSTOMER_REPORTS': 'تقارير العملاء'
    };
    return titles[key] || key;
  }
}
