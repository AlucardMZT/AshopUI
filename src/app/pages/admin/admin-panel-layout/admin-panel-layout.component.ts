import {Component, OnInit} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-admin-panel-layout',
  imports: [

    MatAnchor,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './admin-panel-layout.component.html',
  styleUrl: './admin-panel-layout.component.scss'
})
export class AdminPanelLayoutComponent implements OnInit {
  adminName: string = '';

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.adminName = payload.nickname || payload.sub || 'Admin';
      } catch (e) {
        console.error('Error al decodificar el token');
        this.adminName = 'Admin';
      }
    }
  }
}
