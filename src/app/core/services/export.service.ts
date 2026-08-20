import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface ExportOptions {
  fileName: string;
  fileType: 'pdf' | 'excel';
  endpoint: string;
  params?: Record<string, any>;
  preview?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly baseUrl = `${environment.apiUrl}/reports/export`;

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/octet-stream'
    });
  }

  exportReport(options: ExportOptions): Observable<Blob> {
    let params = new HttpParams();
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}${options.endpoint}`;
    const headers = this.getAuthHeaders();

    return this.http.get(url, { headers, params, responseType: 'blob' }).pipe(
      tap(blob => {
        if (options.preview) {
          this.downloadBlob(blob, options.fileName, true);
          this.snackBar.open(
            this.translate.instant('REPORTS.OPENED_IN_NEW_TAB', { type: options.fileType.toUpperCase() }),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 3000 }
          );
        } else if (!options.onSuccess) {
          this.downloadBlob(blob, options.fileName, false);
          this.snackBar.open(
            this.translate.instant('REPORTS.DOWNLOADED_SUCCESS', { type: options.fileType.toUpperCase() }),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 3000 }
          );
        }
        if (options.onSuccess) options.onSuccess();
      }),
      catchError(error => {
        const msg = this.translate.instant('REPORTS.DOWNLOAD_ERROR', { type: options.fileType.toUpperCase() });
        if (!options.onError) {
          this.snackBar.open(msg, this.translate.instant('COMMON.CLOSE'), { duration: 3000 });
        }
        if (options.onError) options.onError(error);
        return throwError(() => error);
      })
    );
  }

  private downloadBlob(blob: Blob, fileName: string, preview: boolean = false): void {
    const url = window.URL.createObjectURL(blob);

    if (preview) {
      // Open in new tab for preview
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // If popup is blocked, fallback to download
        this.forceDownload(url, fileName);
      }
    } else {
      // Direct download
      this.forceDownload(url, fileName);
    }

    // Revoke after a delay to ensure the download/view starts
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  private forceDownload(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // === Shortcut export methods ===

  exportExpensesPdf(storeId: number, page = 0, size = 100): Observable<Blob> {
    return this.exportReport({
      fileName: `expenses_${new Date().toISOString().split('T')[0]}.pdf`,
      fileType: 'pdf',
      endpoint: '/expenses/pdf',
      params: { storeId, page, size },
      preview: false
    });
  }

  exportExpensesExcel(storeId: number, page = 0, size = 100): Observable<Blob> {
    return this.exportReport({
      fileName: `expenses_${new Date().toISOString().split('T')[0]}.xlsx`,
      fileType: 'excel',
      endpoint: '/expenses/excel',
      params: { storeId, page, size },
      preview: false
    });
  }

  exportFinancialExcel(storeId: number, startDate?: string, endDate?: string): Observable<Blob> {
    const params: Record<string, any> = { storeId };
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.exportReport({
      fileName: `financial_${startDate || 'start'}_to_${endDate || 'end'}.xlsx`,
      fileType: 'excel',
      endpoint: '/financial/excel',
      params,
      preview: false
    });
  }

  exportSalesPdf(storeId: number, startDate: string, endDate: string): Observable<Blob> {
    return this.exportReport({
      fileName: `sales_${startDate}_to_${endDate}.pdf`,
      fileType: 'pdf',
      endpoint: '/sales/pdf',
      params: { storeId, startDate, endDate },
      preview: false
    });
  }

  exportSalesExcel(storeId: number, startDate: string, endDate: string): Observable<Blob> {
    return this.exportReport({
      fileName: `sales_${startDate}_to_${endDate}.xlsx`,
      fileType: 'excel',
      endpoint: '/sales/excel',
      params: { storeId, startDate, endDate },
      preview: false
    });
  }

  exportExpiryPdf(storeId: number): Observable<Blob> {
    return this.exportReport({
      fileName: `expiry_${new Date().toISOString().split('T')[0]}.pdf`,
      fileType: 'pdf',
      endpoint: '/expiry/pdf',
      params: { storeId },
      preview: false
    });
  }

  exportExpiryExcel(storeId: number): Observable<Blob> {
    return this.exportReport({
      fileName: `expiry_${new Date().toISOString().split('T')[0]}.xlsx`,
      fileType: 'excel',
      endpoint: '/expiry/excel',
      params: { storeId },
      preview: false
    });
  }
}
