import { Component, OnInit } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {HttpClient} from '@angular/common/http';
import {SuccessDialogComponent} from '../../shared/success-dialog/success-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {CountryService} from '../../services/country.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, RouterLink, MatSelectModule, MatCardModule],
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


  constructor(private http: HttpClient,  private router: Router, private country: CountryService,
              private dialog: MatDialog,) {}

  ngOnInit() {
    this.country.getCountries().subscribe({
      next: (data) => {
        this.countries = data.map(c => {
          const rawId = (c as any).id ?? (c as any)._id ?? (c as any).countryId ?? (c as any).ID;
          return { ...c, id: Number(rawId) };
        });
        console.log('🌍 países cargados:', this.countries);
      },
      error: (err) => {
        console.error('❌ Error al cargar países', err);
      }
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

    console.log('📤 register payload', payload);

    this.http.post(`${environment.apiUrl}/auth/register`, payload, {
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
        if (err?.status === 0) {
          this.mensaje = `❌ No se pudo conectar con el servidor. Verifica que la API esté corriendo en: ${environment.apiUrl}`;
        } else {
          this.mensaje = '❌ ' + (err.error || 'Error al registrar.');
        }
        this.esError = true;
      }
    });
  }
}
