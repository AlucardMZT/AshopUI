import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRole = route.data['role'];
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || (expectedRole && currentUser.role?.toUpperCase() !== expectedRole.toUpperCase())) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
