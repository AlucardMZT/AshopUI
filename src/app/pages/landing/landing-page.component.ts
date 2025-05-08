import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    const visited = localStorage.getItem('visited');
    if (visited) {
      this.router.navigate(['/home']);
    }
  }

  enterApp() {
    localStorage.setItem('visited', 'true');
    this.router.navigate(['/home']);
  }
}
