import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CarouselModule} from 'ngx-owl-carousel-o';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {MatCard, MatCardContent, MatCardImage} from '@angular/material/card';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Product} from '../../models/product.model';
import {ProductService} from '../../services/product.service';
import {Category} from '../../models/category.model';
import {CategoryService} from '../../services/category.service';
import {AuthService} from '../../services/auth.service';
import {DiscountService} from '../../services/DiscountService';

@Component({
  selector: 'app-home',
  imports: [CarouselModule, MatCard, NgForOf, MatCardContent, MatCardImage, RouterLink, MatButton, MatIcon, NgIf, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  destacados: Product[] = [];
  categorias: Category[] = [];
  @ViewChild('carouselContainer', {static: false}) carouselContainer!: ElementRef;
  dragging = false;
  startX = 0;
  scrollLeft = 0;


  constructor(private productService: ProductService, private discountService: DiscountService,
              private router: Router, private categoryService: CategoryService, public authService: AuthService) {
  }


  ngOnInit(): void {
    this.categoryService.getAll().subscribe((cats) => {
      this.categorias = cats.filter(cat =>
        ['Electrónica', 'Ropa', 'Juguetes'].includes(cat.name)
      );
    });
    this.loadDestacados();
    this.loadProductosConDescuento();
  }

  loadDestacados(): void {
    this.productService.getDestacados().subscribe({
      next: destacadosOriginales => {
        this.discountService.getConDescuentosOffline().subscribe({
          next: conDescuentos => {
            // Reemplazar los productos destacados con versión con descuento si existe
            this.destacados = destacadosOriginales.map(prod => {
              const conDesc = conDescuentos.find(p => p.id === prod.id);
              return conDesc ? { ...prod, ...conDesc } : prod;
            });
            console.log('Destacados final con descuentos:', this.destacados);
          },
          error: err => console.error('Error al cargar descuentos:', err)
        });
      },
      error: err => console.error('Error al cargar destacados:', err)
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
    this.router.navigate(['/productos'], {queryParams: {categoria: id}});
  }

  startDrag(event: MouseEvent | TouchEvent): void {
    this.dragging = true;
    const container = this.carouselContainer.nativeElement;
    this.startX = this.getPositionX(event) - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;
  }

  onDrag(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) return;
    event.preventDefault(); // evita selección o scroll vertical
    const container = this.carouselContainer.nativeElement;
    const x = this.getPositionX(event) - container.offsetLeft;
    const walk = (x - this.startX) * 1.5; // sensibilidad
    container.scrollLeft = this.scrollLeft - walk;
  }

  stopDrag(): void {
    this.dragging = false;
  }

  private getPositionX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;
  }

  loadProductosConDescuento(): void {
    this.discountService.getConDescuentosOffline().subscribe({
      next: productos => {
        this.destacados = productos.filter(p => p.isFeatured);
      }
    });
  }
}
