import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup, FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {NgForOf, NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {catchError, map, Observable, of} from 'rxjs';
import {MatOption, MatSelect} from '@angular/material/select';
import {HttpClient} from '@angular/common/http';
import {CountryService} from '../../../services/country.service';

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
    MatOption,
    MatSelect,
    NgForOf,
    FormsModule,

  ]
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  message = '';
  error = '';
  user: User | null = null;
  countries: any[] = [];
  countryId: number | null = null;

  constructor(private http: HttpClient,private fb: FormBuilder, private authService: AuthService, private countryService: CountryService) {}

  ngOnInit() {
    this.countryService.getCountries().subscribe({
      next: countries => {
        this.countries = countries;

        this.authService.getProfile().subscribe(user => {
          this.user = user;

          const matchedCountry = this.countries.find(c => c.name === user.countryName);
          const countryId = matchedCountry?.id ?? null;

          this.profileForm = this.fb.group({
            name: [user.name],
            email: [user.email, {
              validators: [Validators.required, Validators.email],
              asyncValidators: [this.emailExistsValidator.bind(this)],
              updateOn: 'blur'
            }],
            nickname: [user.nickname, {
              validators: [Validators.required],
              asyncValidators: [this.nicknameExistsValidator.bind(this)],
              updateOn: 'blur'
            }],
            phone: [user.phone],
            address: [user.address],
            address2: [user.address2],
            address3: [user.address3],
            address4: [user.address4],
            postalCode: [user.postalCode],
            state: [user.state],
            municipality: [user.municipality],
            houseDescription: [user.houseDescription],
            countryId: [countryId, Validators.required],
            password: ['']
          });
        });
      },
      error: err => console.error('❌ Error al cargar países', err)
    });
  }



  onSave() {
    if (this.profileForm.invalid) return;

    const formData = { ...this.profileForm.value };

    // Convertir countryId en objeto country
    const selectedCountry = this.countries.find(c => c.id === formData.countryId);
    if (selectedCountry) {
      formData.country = { id: selectedCountry.id }; // lo que espera el backend
      formData.countryName = selectedCountry.name;
    }

    delete formData.countryId;

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

  emailExistsValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const email = control.value;
    if (!email || email === this.user?.email) return of(null); // No valida si es su mismo email

    return this.authService.checkEmailExists(email).pipe(
      map(exists => exists ? { emailExists: true } : null),
      catchError(() => of(null))
    );
  }

// Nickname validator
  nicknameExistsValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const nickname = control.value;
    if (!nickname || nickname === this.user?.nickname) return of(null);

    return this.authService.checkNicknameExists(nickname).pipe(
      map(exists => exists ? { nicknameExists: true } : null),
      catchError(() => of(null))
    );
  }

}
