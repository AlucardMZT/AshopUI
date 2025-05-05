import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {Catalog} from '../../models/catalog.model';
import {CatalogService} from '../../services/catalog.service';
import { HttpErrorResponse } from '@angular/common/http';
import {CarouselModule} from 'ngx-owl-carousel-o';


@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, MatCardModule, CarouselModule],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss']
})
export class CatalogoComponent implements OnInit {
  categories: Catalog[] = [];

  carouselOptions = {
    loop: true,
    margin: 10,
    nav: true,
    dots: false,
    responsive: {
      0: { items: 1 },
      600: { items: 2 },
      960: { items: 3 },
      1200: { items: 4 }
    }
  };

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.catalogService.getCatalogs().subscribe({
      next: (data: Catalog[]) => this.categories = data,
      error: (err: HttpErrorResponse) => console.error('Error al cargar catálogos', err)
    });
  }
}
