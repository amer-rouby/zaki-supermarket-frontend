import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/LoginRequest.model';
import { RegisterRequest } from '../models/RegisterRequest.model';
import { AuthResponse } from '../models/AuthResponse.model';
import { SessionStatus, ExtendSessionResponse, SessionWarningData } from '../models/session-status.model';
import { MatDialog } from '@angular/material/dialog';
import { SessionWarningDialogComponent } from '../../shared/components/session-warning-dialog/session-warning-dialog.component';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Token expiry buffer: refresh if token expires within 5 minutes
  private readonly TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

  private warningTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private expiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Track if warning dialog is open
  private warningDialogOpen = false;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // A 2FA-enabled account: no accessToken yet, nothing to persist - the caller
        // must show a code-entry step and call completeTwoFactorLogin() next.
        if (response.twoFactorRequired) {
          return;
        }
        this.setSession(response);
        this.startSessionMonitor();
      })
    );
  }

  /**
   * Second step of login when login() returned twoFactorRequired=true.
   */
  completeTwoFactorLogin(tempToken: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/2fa/login`, { tempToken, code }).pipe(
      tap(response => {
        this.setSession(response);
        this.startSessionMonitor();
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        this.setSession(response);
        this.startSessionMonitor();
      })
    );
  }

  /**
   * Logout: calls backend to revoke session, then clears local storage
   */
  logout(): Observable<any> {
    this.stopSessionMonitor();

    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
        tap(() => {
          this.clearSession();
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      );
    }
    this.clearSession();
    return of(null);
  }

  /**
   * Force logout without calling backend (used for SESSION_EXPIRED)
   */
  forceLogout(): void {
    this.stopSessionMonitor();
    this.clearSession();
  }

  /**
   * Refresh the access token using the refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh?refreshToken=${refreshToken}`, {}).pipe(
      tap(response => {
        this.setSession(response);
        this.startSessionMonitor();
      }),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Extend session manually (called from SESSION_WARNING dialog)
   */
  extendSession(): Observable<ExtendSessionResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
    return this.http.post<ExtendSessionResponse>(`${this.apiUrl}/extend-session`, {}, { headers }).pipe(
      tap(response => {
        if (response.success && response.expiresAt) {
          localStorage.setItem('expiresAt', response.expiresAt);
          this.startSessionMonitor();
        }
        if (response.remainingExtensions !== undefined) {
          localStorage.setItem('remainingExtensions', response.remainingExtensions.toString());
        }
      }),
      catchError(error => {
        if (
          error.status === 401 ||
          error.error?.code === 'MAX_EXTENSIONS_REACHED' ||
          error.error?.code === 'SESSION_EXPIRED'
        ) {
          this.clearSession();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current session status
   */
  getSessionStatus(): Observable<SessionStatus> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
    return this.http.get<SessionStatus>(`${this.apiUrl}/session-status`, { headers });
  }

  /**
   * Reflect a store name change (from Settings > Store) into the cached session
   * immediately, since the header/sidebar store name comes from this cached user
   * snapshot rather than a live API call - without this, a saved rename only shows
   * up after the next login.
   */
  updateStoreName(storeName: string): void {
    const user = this.getCurrentUser();
    if (!user) return;
    const updated = { ...user, storeName };
    localStorage.setItem(environment.userKey, JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  /**
   * Update local session data from response headers (X-Session-Extended, X-Remaining-Extensions)
   */
  updateLocalSession(remainingExtensions: string | null): void {
    if (remainingExtensions !== null) {
      localStorage.setItem('remainingExtensions', remainingExtensions);
    }
    // The expiresAt is updated automatically from the response
    const user = this.getCurrentUser();
    if (user) {
      this.currentUserSubject.next({ ...user });
    }
  }

  /**
   * Backward-compatible alias used by guards.
   */
  startSessionKeepalive(): void {
    this.startSessionMonitor();
  }

  /**
   * Backward-compatible alias used by logout and expiry handling.
   */
  stopSessionKeepalive(): void {
    this.stopSessionMonitor();
  }

  /**
   * Handle SESSION_WARNING - show dialog to user
   */
  private handleSessionWarning(data: SessionWarningData): void {
    // Prevent multiple dialogs
    if (this.warningDialogOpen) return;
    this.warningDialogOpen = true;

    const dialogRef = this.dialog.open(SessionWarningDialogComponent, {
      width: '400px',
      disableClose: true,
      data: data
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      this.warningDialogOpen = false;

      if (result) {
        // User clicked "Extend" → call extend-session API
        this.extendSession().subscribe({
          next: (response) => {
            if (!response.success) {
              this.forceLogout();
              this.router.navigate(['/auth/login']);
            }
          },
          error: (err) => {
            if (
              err.status === 401 ||
              err.error?.code === 'MAX_EXTENSIONS_REACHED' ||
              err.error?.code === 'SESSION_EXPIRED'
            ) {
              this.forceLogout();
              this.router.navigate(['/auth/login']);
            }
          }
        });
      } else {
        // User clicked "Logout" → revoke backend session and clear local data
        this.logout().subscribe({
          next: () => this.router.navigate(['/auth/login']),
          error: () => this.router.navigate(['/auth/login'])
        });
      }
    });
  }

  /**
   * Check if keepalive is running
   */
  isKeepaliveRunning(): boolean {
    return this.warningTimeoutId !== null || this.expiryTimeoutId !== null;
  }

  /**
   * Check if the access token is about to expire (within buffer window)
   */
  isTokenExpiringSoon(): boolean {
    const user = this.getCurrentUser();
    if (!user?.expiresIn) {
      return false;
    }
    const now = Date.now();
    return (user.expiresIn - now) < this.TOKEN_EXPIRY_BUFFER_MS;
  }

  /**
   * Check if user is logged in (has a valid token in storage)
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem(environment.tokenKey);
  }

  /**
   * Get the current access token
   */
  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  /**
   * Get the refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  /**
   * Get the current user object
   */
  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get user ID
   */
  getUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.userId || null;
  }

  /**
   * Get store ID
   */
  getStoreId(): number | null {
    const user = this.getCurrentUser();
    return user?.storeId || null;
  }

  /**
   * Get store info
   */
  getStoreInfo(): any {
    const user = this.getCurrentUser();
    if (user?.storeId) {
      return {
        id: user.storeId,
        name: user.storeName || 'سوبر ماركت زكي',
        address: '',
        phone: '',
        email: ''
      };
    }
    return null;
  }

  /**
   * Get session expiry time (ISO datetime)
   */
  getExpiresAt(): string | null {
    return localStorage.getItem('expiresAt');
  }

  /**
   * Get session timeout in minutes
   */
  getSessionTimeout(): number | null {
    const timeout = localStorage.getItem('sessionTimeout');
    return timeout ? parseInt(timeout, 10) : null;
  }

  /**
   * Get remaining extensions
   */
  getRemainingExtensions(): number {
    const val = localStorage.getItem('remainingExtensions');
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Get max extensions
   */
  getMaxExtensions(): number {
    const user = this.getCurrentUser();
    return user?.maxExtensions || 3;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Save session data to local storage and update the subject
   */
  private setSession(response: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, response.accessToken);
    localStorage.setItem(environment.refreshTokenKey, response.refreshToken);
    if (response.expiresAt) {
      localStorage.setItem('expiresAt', response.expiresAt);
    }
    if (response.sessionTimeout) {
      localStorage.setItem('sessionTimeout', response.sessionTimeout.toString());
    }
    if (response.remainingExtensions !== undefined) {
      localStorage.setItem('remainingExtensions', response.remainingExtensions.toString());
    }
    localStorage.setItem(environment.userKey, JSON.stringify(response));
    this.currentUserSubject.next(response);
    this.startSessionMonitor();
  }

  /**
   * Clear all session data from storage
   */
  private clearSession(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('sessionTimeout');
    localStorage.removeItem('remainingExtensions');
    localStorage.removeItem(environment.userKey);
    this.currentUserSubject.next(null);
  }

  /**
   * Load user from storage on app initialization
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(environment.userKey);
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as AuthResponse;
        this.currentUserSubject.next(user);
        this.startSessionMonitor();
      } catch {
        this.clearSession();
      }
    }
  }

  private startSessionMonitor(): void {
    this.stopSessionMonitor();

    const expiresAt = this.getExpiresAt();
    if (!expiresAt || !this.getToken()) {
      return;
    }

    const expiresAtMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) {
      return;
    }

    const now = Date.now();
    const msUntilExpiry = expiresAtMs - now;
    if (msUntilExpiry <= 0) {
      this.forceLogout();
      this.router.navigate(['/auth/login'], { queryParams: { expired: true } });
      return;
    }

    const warningThresholdMinutes = this.getWarningThreshold();
    const msUntilWarning = msUntilExpiry - (warningThresholdMinutes * 60 * 1000);

    if (msUntilWarning <= 0) {
      this.showLocalSessionWarning(expiresAtMs, warningThresholdMinutes);
    } else {
      this.warningTimeoutId = this.safeSetTimeout(() => {
        this.showLocalSessionWarning(expiresAtMs, warningThresholdMinutes);
      }, msUntilWarning);
    }

    this.expiryTimeoutId = this.safeSetTimeout(() => {
      this.forceLogout();
      this.router.navigate(['/auth/login'], { queryParams: { expired: true } });
    }, msUntilExpiry);
  }

  // setTimeout's delay is a 32-bit signed int internally - anything past ~24.8 days
  // overflows and fires almost immediately instead of waiting. A 30-day "remember me"
  // session blows well past that, so long delays get chained: re-run the monitor after
  // the safe max, which recomputes both timers fresh against the still-current
  // expiresAt rather than trying to carry the original callback across the gap.
  private static readonly MAX_TIMEOUT_MS = 2147483647;

  private safeSetTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> {
    if (delayMs > AuthService.MAX_TIMEOUT_MS) {
      return setTimeout(() => this.startSessionMonitor(), AuthService.MAX_TIMEOUT_MS);
    }
    return setTimeout(callback, delayMs);
  }

  private stopSessionMonitor(): void {
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }

    if (this.expiryTimeoutId) {
      clearTimeout(this.expiryTimeoutId);
      this.expiryTimeoutId = null;
    }
  }

  private showLocalSessionWarning(expiresAtMs: number, warningThresholdMinutes: number): void {
    const remainingMinutes = Math.max(1, Math.ceil((expiresAtMs - Date.now()) / 60000));
    this.handleSessionWarning({
      remainingMinutes: Math.min(remainingMinutes, warningThresholdMinutes),
      canExtend: this.getRemainingExtensions() > 0,
      remainingExtensions: this.getRemainingExtensions(),
      expiresAt: new Date(expiresAtMs).toISOString()
    });
  }

  private getWarningThreshold(): number {
    const user = this.getCurrentUser();
    return user?.warningThreshold || 5;
  }
}
