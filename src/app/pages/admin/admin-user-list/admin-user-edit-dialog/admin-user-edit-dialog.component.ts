import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../../models/user.model';
import { AuthService } from '../../../../services/auth.service';
import { CommonModule } from '@angular/common';

import {
  MatFormFieldModule,
  MatLabel,
  MatError,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-admin-user-edit-dialog',
  standalone: true,
  templateUrl: './admin-user-edit-dialog.component.html',
  styleUrls: ['./admin-user-edit-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatLabel,
    MatError,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgIf,
  ]
})
export class AdminUserEditDialogComponent {
  form: FormGroup;
  isSaving = false;
  nicknameError = '';
  emailError = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<AdminUserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {
    this.form = this.fb.group({
      name: [data.name, Validators.required],
      nickname: [data.nickname, Validators.required],
      email: [data.email, [Validators.required, Validators.email]],
      phone: [data.phone],
    });
  }

  onGuardar() {
    if (this.form.invalid) return;

    this.isSaving = true;
    this.nicknameError = '';
    this.emailError = '';
    this.errorMessage = '';

    const userData = { ...this.data, ...this.form.value };

    this.authService.updateUser(userData).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.isSaving = false;
        const msg = err.error;
        if (typeof msg === 'string') {
          if (msg.includes('nickname')) {
            this.nicknameError = 'El nickname ya está en uso.';
          } else if (msg.includes('correo')) {
            this.emailError = 'El correo ya está registrado.';
          } else {
            this.errorMessage = msg;
          }
        } else {
          this.errorMessage = 'Ocurrió un error inesperado.';
        }
      }
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
