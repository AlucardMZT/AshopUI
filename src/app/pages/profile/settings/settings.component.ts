import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    MatLabel,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    NgIf,
    MatButton,
  ]
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  message = '';
  error = '';
  user: User | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe(user => {
      this.user = user;
      console.log(this.user, 'user')
      this.profileForm = this.fb.group({
        name: [user.name],
        email: [user.email, [Validators.required, Validators.email]],
        nickname: [user.nickname, Validators.required],
        phone: [user.phone],
        address: [user.address],
        address2: [user.address2],
        address3: [user.address3],
        address4: [user.address4],
        postalCode: [user.postalCode],
        state: [user.state],
        municipality: [user.municipality],
        houseDescription: [user.houseDescription],
        password: ['']  // opcional
      });
    });
  }

  onSave() {
    if (this.profileForm.invalid) return;

    const formData = this.profileForm.value;
    if (!formData.password) delete formData.password;

    this.authService.updateUser(formData).subscribe({
      next: res => {
        this.message = '✅ Cambios guardados correctamente';
        this.error = '';
      },
      error: err => {
        this.error = '❌ ' + (err.error || 'Error al guardar los cambios');
        this.message = '';
      }
    });
  }
}
