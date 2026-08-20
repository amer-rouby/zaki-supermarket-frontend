import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user has a token, check if it's expiring soon and try to refresh
  if (authService.isLoggedIn()) {
    if (authService.isTokenExpiringSoon()) {
      // Try to refresh the token before allowing access
      return authService.refreshToken().pipe(
        map(() => true),
        catchError(() => {
          authService.forceLogout();
          router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: true }
          });
          return of(false);
        })
      );
    }
    authService.startSessionKeepalive();
    return true;
  }

  // Not logged in, redirect to login
  router.navigate(['/auth/login']);
  return false;
};
