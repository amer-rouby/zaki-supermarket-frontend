import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MaterialModule } from '../../../shared/material.module';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { ZakiFeatureSettingsService } from '../../../core/services/settings/zaki-feature-settings.service';
import { ZakiFeatureSettings, ZakiFeatureSettingsRequest } from '../../../core/models/settings/zaki-feature-settings.model';

interface FeatureToggle {
  key: keyof ZakiFeatureSettingsRequest;
  icon: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-zaki-features-settings',
  standalone: true,
  imports: [MaterialModule, PageHeaderComponent, FormsModule],
  templateUrl: './zaki-features-settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './zaki-features-settings.component.scss'
})
export class ZakiFeaturesSettingsComponent implements OnInit {
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly zakiFeatureSettingsService = inject(ZakiFeatureSettingsService);

  readonly loading = signal(false);
  readonly saving = signal(false);

  toggles: FeatureToggle[] = [];

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);

    this.zakiFeatureSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.toggles = this.buildToggles(settings);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorHandler.handleHttpError(err, 'ZAKI_FEATURES.LOAD_ERROR');
      }
    });
  }

  private buildToggles(settings: ZakiFeatureSettings): FeatureToggle[] {
    return [
      {
        key: 'stockPredictionEnabled', icon: 'psychology',
        label: 'ZAKI_FEATURES.STOCK_PREDICTION', description: 'ZAKI_FEATURES.DESC.STOCK_PREDICTION',
        enabled: settings.stockPredictionEnabled
      },
      {
        key: 'reorderRecommendationsEnabled', icon: 'add_shopping_cart',
        label: 'ZAKI_FEATURES.REORDER_RECOMMENDATIONS', description: 'ZAKI_FEATURES.DESC.REORDER_RECOMMENDATIONS',
        enabled: settings.reorderRecommendationsEnabled
      },
      {
        key: 'pricingRecommendationsEnabled', icon: 'sell',
        label: 'ZAKI_FEATURES.PRICING_RECOMMENDATIONS', description: 'ZAKI_FEATURES.DESC.PRICING_RECOMMENDATIONS',
        enabled: settings.pricingRecommendationsEnabled
      },
      {
        key: 'supplierRecommendationsEnabled', icon: 'local_shipping',
        label: 'ZAKI_FEATURES.SUPPLIER_RECOMMENDATIONS', description: 'ZAKI_FEATURES.DESC.SUPPLIER_RECOMMENDATIONS',
        enabled: settings.supplierRecommendationsEnabled
      },
      {
        key: 'dashboardInsightsEnabled', icon: 'insights',
        label: 'ZAKI_FEATURES.DASHBOARD_INSIGHTS', description: 'ZAKI_FEATURES.DESC.DASHBOARD_INSIGHTS',
        enabled: settings.dashboardInsightsEnabled
      },
      {
        key: 'dailyBriefEnabled', icon: 'today',
        label: 'ZAKI_FEATURES.DAILY_BRIEF', description: 'ZAKI_FEATURES.DESC.DAILY_BRIEF',
        enabled: settings.dailyBriefEnabled
      },
      {
        key: 'anomalyDetectionEnabled', icon: 'gpp_maybe',
        label: 'ZAKI_FEATURES.ANOMALY_DETECTION', description: 'ZAKI_FEATURES.DESC.ANOMALY_DETECTION',
        enabled: settings.anomalyDetectionEnabled
      },
      {
        key: 'realtimeUpdatesEnabled', icon: 'bolt',
        label: 'ZAKI_FEATURES.REALTIME_UPDATES', description: 'ZAKI_FEATURES.DESC.REALTIME_UPDATES',
        enabled: settings.realtimeUpdatesEnabled
      },
      {
        key: 'voiceSearchEnabled', icon: 'mic',
        label: 'ZAKI_FEATURES.VOICE_SEARCH', description: 'ZAKI_FEATURES.DESC.VOICE_SEARCH',
        enabled: settings.voiceSearchEnabled
      },
      {
        key: 'customerCreditEnabled', icon: 'account_balance_wallet',
        label: 'ZAKI_FEATURES.CUSTOMER_CREDIT', description: 'ZAKI_FEATURES.DESC.CUSTOMER_CREDIT',
        enabled: settings.customerCreditEnabled
      },
      {
        key: 'aiAssistantEnabled', icon: 'smart_toy',
        label: 'ZAKI_FEATURES.AI_ASSISTANT', description: 'ZAKI_FEATURES.DESC.AI_ASSISTANT',
        enabled: settings.aiAssistantEnabled
      },
      {
        key: 'eInvoiceEnabled', icon: 'receipt_long',
        label: 'ZAKI_FEATURES.E_INVOICE', description: 'ZAKI_FEATURES.DESC.E_INVOICE',
        enabled: settings.eInvoiceEnabled
      },
      {
        key: 'offlineModeEnabled', icon: 'wifi_off',
        label: 'ZAKI_FEATURES.OFFLINE_MODE', description: 'ZAKI_FEATURES.DESC.OFFLINE_MODE',
        enabled: settings.offlineModeEnabled
      }
    ];
  }

  onSave(): void {
    this.saving.set(true);

    const request: ZakiFeatureSettingsRequest = this.toggles.reduce((acc, toggle) => {
      (acc as any)[toggle.key] = toggle.enabled;
      return acc;
    }, {} as ZakiFeatureSettingsRequest);

    this.zakiFeatureSettingsService.updateSettings(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.errorHandler.showSuccess('SETTINGS.SAVE_SUCCESS');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorHandler.handleHttpError(err, 'SETTINGS.SAVE_ERROR');
      }
    });
  }

  onReset(): void {
    this.loadSettings();
    this.errorHandler.showSuccess('COMMON.RESET');
  }
}
