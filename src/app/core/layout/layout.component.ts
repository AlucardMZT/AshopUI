import {Component, OnInit} from '@angular/core';
import {FooterComponent} from '../footer/footer.component';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatToolbar} from '@angular/material/toolbar';
import {AuthService} from '../../services/auth.service';
import {NgIf} from '@angular/common';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';
import { CartService } from '../../services/car.service';
import {CartItem} from '../../models/caritem.model';

@Component({
  selector: 'app-layout',
  imports: [
    MatAnchor,
    RouterLink,
    MatToolbar,
    NgIf,
    MatProgressSpinner,
    MatButton,
    MatIcon
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit{
  nickname: string | null = null;
  userNickname: string = '';
  isLoading = false;
  isAdmin = false;
  cartCount = 0;

  constructor(protected authService: AuthService, private router: Router,  private cartService: CartService) {}

  ngOnInit() {
    this.cartService.cart$.subscribe((cart: CartItem[]) => {
      this.cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    });

    this.authService.authStatus$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.isLoading = true;
        this.authService.getProfile().subscribe({
          next: user => {
            this.userNickname = user.nickname;
            this.isLoading = false;
          },
          error: err => {
            console.error('Error cargando perfil', err);
            this.userNickname = '';
            this.isLoading = false;
          }
        });
      } else {
        this.userNickname = '';
      }
    });
  }

  logout() {
    this.authService.logout();
    this.nickname = null;

    this.router.navigateByUrl('/dummy', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/home']);
    });
  }
}
