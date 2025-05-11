import { Component } from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {Router} from '@angular/router';
import {NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  imports: [
    MatToolbar,
    NgIf,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  rutasSinFooter: (string | RegExp)[] = [
    '/login',
    '/register',
    '/forgot-password',
    /^\/productos\/\d+$/  // Coincide con /productos/1, /productos/123, etc.
  ];

  constructor(public router: Router) {}

  mostrarFooter(): boolean {
    const url = this.router.url;

    return !this.rutasSinFooter.some((ruta) => {
      if (typeof ruta === 'string') {
        return ruta === url;
      } else {
        return ruta.test(url); // para rutas con RegExp
      }
    });
  }

}
