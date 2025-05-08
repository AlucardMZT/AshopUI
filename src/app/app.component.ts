import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import {FooterComponent} from './core/footer/footer.component';
import {LayoutComponent} from './core/layout/layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, LayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  implements OnInit {
  title = 'ashopweb';

 constructor(private router: Router) {}

  ngOnInit() {
    const visited = localStorage.getItem('visited');
    if (!visited) {
      this.router.navigate(['/landing']);
    }
  }


}
