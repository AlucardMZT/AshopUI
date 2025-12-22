import { Component } from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {Router} from '@angular/router';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [
    MatToolbar,
    NgIf
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  rutasSinFooter: (string | RegExp)[] = [
    '/login',
    '/register',
    /^\/productos\/\d+$/
  ];

  constructor(public router: Router) {}

  mostrarFooter(): boolean {
    const url = this.router.url;

    return !this.rutasSinFooter.some((ruta) => {
      if (typeof ruta === 'string') {
        return ruta === url;
      } else {
        return ruta.test(url);
      }
    });
  }

}
