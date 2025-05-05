import { Component } from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [ CarouselModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  banners = [
    { image: 'assets/banners/banner1.jpg', alt: 'Promo 1' },
    { image: 'assets/banners/banner2.jpg', alt: 'Promo 2' },
    { image: 'assets/banners/banner3.jpg', alt: 'Promo 3' }
  ];

  customOptions = {
    loop: true,
    autoplay: true,
    autoplayTimeout: 4000,
    dots: true,
    nav: false,
    responsive: {
      0: { items: 1 },
      600: { items: 1 },
      1000: { items: 1 }
    }
  };

}
