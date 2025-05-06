import {Component, OnInit} from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import {NgForOf, NgIf} from '@angular/common';
import {MatCard, MatCardContent, MatCardImage} from '@angular/material/card';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Product} from '../../models/product.model';
import {ProductService} from '../../services/product.service';
import {Category} from '../../models/category.model';
import {CategoryService} from '../../services/category.service';

@Component({
  selector: 'app-home',
  imports: [CarouselModule, MatCard, NgForOf, MatCardContent, MatCardImage, RouterLink, MatButton, MatIcon, NgIf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  destacados: Product[] = [];
  categorias: Category[] = [];

  constructor(private productService: ProductService,private router: Router,private categoryService: CategoryService) {}


  ngOnInit(): void {
    this.categoryService.getAll().subscribe((cats) => {
      this.categorias = cats.filter(cat =>
        ['Electrónica', 'Ropa', 'Juguetes'].includes(cat.name)
      );
    });
    this.loadDestacados();
  }

  loadDestacados(): void {
    this.productService.getDestacados().subscribe({
      next: (productos) => {
        this.destacados = productos;
      },
      error: (err) => {
        console.error('Error al cargar productos destacados:', err);
      }
    });
  }

  verDetalle(id: number): void {
    this.router.navigate(['/productos', id]);
  }

  beneficios = [
    {
      icon: 'local_shipping',
      title: 'Envío Rápido',
      description: 'Entrega en todo México en menos de 72 horas.'
    },
    {
      icon: 'verified_user',
      title: 'Pagos Seguros',
      description: 'Procesamos tus pagos con seguridad total.'
    },
    {
      icon: 'support_agent',
      title: 'Atención 24/7',
      description: 'Soporte disponible todos los días.'
    }
  ];

  verCategoria(id: number): void {
    this.router.navigate(['/productos'], { queryParams: { categoria: id } });
  }
}
