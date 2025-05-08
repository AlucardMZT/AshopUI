import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatInputModule, MatLabel} from '@angular/material/input';
import {MatCard} from '@angular/material/card';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {UserRegisterRequest} from '../../models/register.model';
import {MatFormFieldModule} from '@angular/material/form-field';
import {HttpClient} from '@angular/common/http';
import {SuccessDialogComponent} from '../../shared/success-dialog/success-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, RouterLink, MatSelect, MatOption],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit{
  name = '';
  email = '';
  password = '';
  nickname = '';
  address = '';
  address2 = '';
  address3 = '';
  address4 = '';
  postalCode = '';
  phone = '';
  state = '';
  municipality = '';
  houseDescription = '';
  city = '';
  mensaje: string = '';
  esError: boolean = false;

  countries: any[] = [];
  countryId: number | null = null;

  constructor(private http: HttpClient,  private router: Router,
              private dialog: MatDialog,) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:8080/api/countries').subscribe({
      next: data => {
        this.countries = data;
      },
      error: err => console.error('❌ Error al cargar países', err)
    });
  }

  validarNicknameReservado(nick: string): boolean {
    const reservados = ['admin', 'administrador', 'owner', 'dueño'];
    return reservados.includes(nick.trim().toLowerCase());
  }

  onRegister() {
    if (this.validarNicknameReservado(this.nickname)) {
      this.mensaje = '❌ Este nickname está reservado. Elige otro.';
      this.esError = true;
      return;
    }

    const payload = {
      name: this.name,
      nickname: this.nickname,
      email: this.email,
      password: this.password,
      phone: this.phone,
      address: this.address,
      address2: this.address2,
      address3: this.address3,
      address4: this.address4,
      postalCode: this.postalCode,
      state: this.state,
      municipality: this.municipality,
      houseDescription: this.houseDescription,
      countryId: this.countryId,
      city: this.city,
      country: this.countries.find(c => c.id === this.countryId)?.name || ''
    };

    this.http.post('http://localhost:8080/api/auth/register', payload, {
      responseType: 'text'
    }).subscribe({
      next: () => {
        const dialogRef = this.dialog.open(SuccessDialogComponent, {
          data: {
            message: '¡Felicidades! Usuario registrado correctamente.'
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.mensaje = '❌ ' + (err.error || 'Error al registrar.');
        this.esError = true;
      }
    });
  }
}
