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
  rutasSinFooter = ['/login', '/register'];

  constructor(public router: Router) {}

  mostrarFooter(): boolean {
    return !this.rutasSinFooter.includes(this.router.url);
  }
}
