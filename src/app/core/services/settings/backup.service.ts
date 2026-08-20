import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../models';
import { Backup, CreateBackupRequest } from '../../models/settings/Backup.model';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings/backup`;

  // Deliberately no restore endpoint/method here - the backend has none either
  // (see StoreBackupController's comment: restoring one store's data back
  // into a live multi-tenant database can collide with other stores' current
  // data, so it stays a manual, platform-operator-reviewed process, not a
  // one-click API call). A restoreBackup() used to exist here calling a route
  // that 404'd, with the error silently swallowed into a fake "success" -
  // removed instead of building a working restore, since that's the backend's
  // deliberate design, not an oversight.

  getBackups(): Observable<Backup[]> {
    return this.http.get<ApiResponse<Backup[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  createBackup(request: CreateBackupRequest): Observable<Backup> {
    return this.http.post<ApiResponse<Backup>>(this.apiUrl, request).pipe(
      map(response => response.data)
    );
  }

  deleteBackup(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  downloadBackup(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
