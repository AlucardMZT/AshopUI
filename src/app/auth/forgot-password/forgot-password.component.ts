import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {MatCard} from '@angular/material/card';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {NgIf} from '@angular/common';
import {MatDivider} from '@angular/material/divider';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password',
  imports: [
    MatCard,
    MatFormField,
    MatInput,
    FormsModule,
    MatButton,
    MatLabel,
    NgIf,
    MatDivider,
    MatIcon
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})

export class ForgotPasswordComponent {
  email = '';
  message = '';
  error = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.message = '📩 Revisa tu correo para restablecer tu contraseña.';
        this.error = '';
      },
      error: () => {
        this.error = '❌ No se pudo enviar el enlace. Verifica el correo.';
        this.message = '';
      }
    });
  }
}
