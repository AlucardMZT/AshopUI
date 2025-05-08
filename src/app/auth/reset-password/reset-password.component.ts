import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {MatCard} from '@angular/material/card';

@Component({
  selector: 'app-reset-password',
  imports: [
    MatFormField,
    MatLabel,
    FormsModule,
    MatInput,
    NgIf,
    MatButton,
    MatCard
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  token = '';
  message = '';
  error = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onReset() {
    if (this.password !== this.confirmPassword) {
      this.error = '❌ Las contraseñas no coinciden.';
      this.message = '';
      return;
    }

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.message = '✅ Contraseña actualizada. Ya puedes iniciar sesión.';
        this.error = '';
      },
      error: () => {
        this.error = '❌ Token inválido o expirado.';
        this.message = '';
      }
    });
  }
}
