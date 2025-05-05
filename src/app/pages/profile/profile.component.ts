import {Component, OnInit} from '@angular/core';
import {NgIf} from '@angular/common';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {User} from '../../models/user.model';
import {AuthService} from '../../services/auth.service';
import {MatSidenav, MatSidenavContainer, MatSidenavModule} from '@angular/material/sidenav';
import {MatListItem, MatNavList} from '@angular/material/list';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [
    MatSidenavContainer,
    MatNavList,
    MatSidenav,
    MatListItem,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user!: User;
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: data => this.user = data,
      error: err => console.error('Error cargando perfil', err)
    });


  }
}
