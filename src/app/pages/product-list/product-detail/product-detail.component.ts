import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../services/car.service';
import { AuthService } from '../../../services/auth.service';
import {MatCard, MatCardContent, MatCardImage} from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatLabel} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {DiscountService} from '../../../services/DiscountService';
import {Category} from '../../../models/category.model';
import {CategoryService} from '../../../services/category.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    MatButton,
    NgIf,
    NgClass,
    RouterLink,
    NgForOf,
    MatFormField,
    MatSelect,
    MatLabel,
    MatOption
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  loading = true;
  mainImage: string = '';
  selectedSize: string = '';
  sizes?: string[];
  categories: Category[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private categoryService: CategoryService,
    private discountService: DiscountService
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
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const numericId = +idParam;
      this.loadProductoConDescuento(numericId);
    }

  this.loadCategories()
  }

  setMainImage(image: string) {
    this.mainImage = image;
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        console.error('❌ Error cargando categorías:', err);
      }
    });
  }

  addToCart(): void {

    const isLoggedIn = this.authService.isLoggedIn();

    if (
      isLoggedIn &&
      this.product?.category?.name?.toLowerCase() === 'ropa' &&
      !this.selectedSize
    ) {
      alert('❗ Por favor, selecciona una talla antes de continuar.');
      return;
    }

    if (!this.authService.getToken()) {
      this.snackBar.open('⚠️ Debes iniciar sesión para agregar al carrito.', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }

    if (this.product) {
      const productWithSize = {
        ...this.product,
        size: this.selectedSize,
        price: this.product.price,
        hasDiscount: this.product.hasDiscount ?? false,
        finalPrice: this.product.finalPrice ?? this.product.price
      };

      console.log(productWithSize)

      const added = this.cartService.addToCart(productWithSize);

      this.snackBar.open(
        added ? '✅ Producto agregado al carrito.' : '➕ Se aumentó la cantidad.',
        'Cerrar',
        { duration: 3000 }
      );
    }
  }


  loadProductoConDescuento(id: number): void {
    this.discountService.getConDescuentosOffline().subscribe({
      next: productos => {
        const encontrado = productos.find(p => p.id === id);
        if (encontrado) {
          const categoria = this.categories.find(c => c.id === encontrado.categoryId);
          this.product = {
            ...encontrado,
            category: categoria || null
          };
          this.mainImage = encontrado.image;
        } else {
          this.loadProductoSinDescuento(id);
        }
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar producto con descuento', err);
        this.loading = false;
      }
    });
  }


  loadProductoSinDescuento(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: product => {
        this.product = product;
        this.mainImage = product.image;
      },
      error: err => {
        console.error('Error al cargar producto sin descuento', err);
      }
    });
  }

  whatsappNumber = '+526691164704';
  whatsappMessage = 'Hola quiero inscribirme como distribuidor';

  openWhatsapp(): void {
    const encoded = encodeURIComponent(this.whatsappMessage);
    const url = `https://wa.me/${this.whatsappNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener');
  }

}
