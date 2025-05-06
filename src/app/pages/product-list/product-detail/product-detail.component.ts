import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../services/car.service';
import { AuthService } from '../../../services/auth.service';
import {MatCard, MatCardContent, MatCardImage} from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import {NgClass, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    MatButton,
    NgIf,
    MatIcon,
    NgClass,
    RouterLink
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  loading = true;
  mainImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(+id).subscribe({
        next: product => {
          this.product = product;
          this.mainImage = product.image;
          this.loading = false;
        },
        error: err => {
          console.error('Error al cargar el producto', err);
          this.loading = false;
        }
      });
    }
  }

  setMainImage(image: string) {
    this.mainImage = image;
  }

  addToCart(): void {
    if (!this.authService.getToken()) {
      this.snackBar.open('⚠️ Debes iniciar sesión para agregar al carrito.', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }

    if (this.product) {
      const added = this.cartService.addToCart(this.product);
      this.snackBar.open(
        added ? '✅ Producto agregado al carrito.' : '➕ Se aumentó la cantidad.',
        'Cerrar',
        { duration: 3000 }
      );
    }
  }
}
