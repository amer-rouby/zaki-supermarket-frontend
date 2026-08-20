import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Auth HTTP Interceptor
 *
 * 1. Adds Bearer token to every protected request
 * 2. Handles 401 responses:
 *    - SESSION_EXPIRED code → force logout
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth endpoints (login, register, refresh)
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  // Clone the request and add the auth header
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle SESSION_EXPIRED (status 401)
      if (error.status === 401 && error.error?.code === 'SESSION_EXPIRED') {
        authService.forceLogout();
        router.navigate(['/auth/login'], {
          queryParams: { expired: true }
        });
        return throwError(() => error);
      }

      // Handle MAX_EXTENSIONS_REACHED (status 400)
      if (error.status === 400 && error.error?.code === 'MAX_EXTENSIONS_REACHED') {
        authService.forceLogout();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};
