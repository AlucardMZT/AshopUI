import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getToken();
    console.log('[AuthGuard] token presente?', !!token);
    console.log('[AuthGuard] token value:', token);

    if (!token) {
      console.log('[AuthGuard] Sin token -> redirigiendo a /login');
      this.router.navigate(['/login']);
      return false;
    }

    if (this.authService.isAdmin()) {
      console.log('[AuthGuard] Usuario es ADMIN => acceso permitido a cualquier ruta');
      return true;
    }

    const expectedRole = route.data['role'];
    if (expectedRole) {
      const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];
      // Permitir si el usuario tiene cualquiera de los roles requeridos OR si es ADMIN
      const hasAny = allowedRoles.some((r: string) => this.authService.hasRole(r)) || this.authService.hasRole('ADMIN');

      if (!hasAny) {
        console.log('[AuthGuard] Roles esperados:', allowedRoles, 'pero user tiene:', this.authService.getCurrentUser());
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    console.log('[AuthGuard] Permitir acceso');
    return true;
  }
}
