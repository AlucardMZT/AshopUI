import {Component, OnInit} from '@angular/core';
import {NgIf} from '@angular/common';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {User} from '../../models/user.model';
import {AuthService} from '../../services/auth.service';
import {MatSidenav, MatSidenavContainer, MatSidenavModule} from '@angular/material/sidenav';
import {MatListItem, MatNavList} from '@angular/material/list';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  imports: [
    MatSidenavContainer,
    MatNavList,
    MatSidenav,
    MatListItem,
    RouterLink,
    RouterOutlet,
    MatSidenavModule,
    MatIcon,
    NgIf,
    MatIconButton
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user!: User;
  isMobile = false;
  constructor(private authService: AuthService, private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: data => this.user = data,
      error: err => console.error('Error cargando perfil', err)
    });


  }
}
