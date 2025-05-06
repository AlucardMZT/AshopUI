import { Component } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatCard} from '@angular/material/card';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatLabel, MatInput, MatLabel, MatFormField, MatButton, RouterLink, ReactiveFormsModule, MatCard],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {// 👈 Ya presente

        this.authService.saveAuthData(res.token, res.nickname);
        if (res.nickname === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/account']);
        }
      },

      error: () => {
        this.errorMessage = '❌ Credenciales inválidas';
      }
    });
  }
}
