// account.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import {NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  imports: [
    MatIcon,
    NgSwitch,
    NgSwitchCase,
    MatButton,
    NgIf,
  ],
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  accountForm!: FormGroup;
  userData!: User;
  isLoading = true;
  isSuccess = false;
  isError = false;
  section: string = 'profile';
  user: User | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => this.user = res,
      error: (err) => console.error('No se pudo cargar el perfil', err)
    });

    this.authService.getProfile().subscribe({
      next: (user) => {
        this.userData = user;
        this.accountForm = this.fb.group({
          name: [user.name, Validators.required],
          nickname: [user.nickname, Validators.required],
          address: [user.address],
          postalCode: [user.postalCode],
          phone: [user.phone],
          state: [user.state],
          municipality: [user.municipality],
          houseDescription: [user.houseDescription]
        });
        this.isLoading = false;
      },
      error: () => {
        this.isError = true;
        this.isLoading = false;
      }
    });
  }

  /*onSubmit() {
    if (this.accountForm.valid) {
      this.authService.updateProfile(this.accountForm.value).subscribe({
        next: () => {
          this.isSuccess = true;
        },
        error: () => {
          this.isError = true;
        }
      });
    }
  }*/
}
