import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {tap} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    tap({
      error: (error) => {
        if (error.status === 401) {
          snackBar.open('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: 'snack-session-expired'
          });

          const existingToken = localStorage.getItem('auth_token');
          const currentUrl = router.url;

          if (existingToken && currentUrl !== '/home' && currentUrl !== '/login') {
            localStorage.removeItem('auth_token');
            router.navigate(['/login']);
          }
        }
      }
    })
  );
};
