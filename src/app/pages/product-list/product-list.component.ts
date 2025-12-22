import { Component, OnInit } from '@angular/core';
import {Product} from '../../models/product.model';
import {MatCard, MatCardActions, MatCardContent, MatCardImage} from '@angular/material/card';
import {CommonModule, NgClass, NgForOf, NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {ProductService} from '../../services/product.service';
import {Category} from '../../models/category.model';
import {CategoryService} from '../../services/category.service';
import {FormsModule} from '@angular/forms';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CartService} from '../../services/car.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {DiscountService} from '../../services/DiscountService';



@Component({
  selector: 'app-product-list',
  standalone: true,
  templateUrl: './product-list.component.html',
  imports: [
    MatCardContent,
    MatCardActions,
    MatCard,
    NgForOf,
    MatButton,
    MatCardImage,
    FormsModule,
    NgIf,
    MatProgressSpinner,
    NgClass,
    CommonModule
  ],
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  allProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;


  productsPerPage = 12;
  currentPage = 1;
  paginatedProducts: Product[] = [];

  searchTerm: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortOrder: 'asc' | 'desc' | '' = '';
  loading = false;


  constructor(
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private categoryService: CategoryService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private discountService: DiscountService
  ) {
  }

  ngOnInit() {

    this.route.queryParams.subscribe(params => {
      const categoriaId = +params['categoria'];

      if (categoriaId) {
        this.filterByCategory(categoriaId);
        this.selectedCategoryId = categoriaId;
      }
    });

    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.discountService.getConDescuentosOffline().subscribe({
      next: (data) => {
        if (this.categories.length > 0) {
          this.allProducts = data.map(prod => {
            const category = this.categories.find(c => c.id === prod.categoryId);
            return {
              ...prod,
              category: category || null
            };
          });
          this.applyFilters();
        } else {
          const interval = setInterval(() => {
            if (this.categories.length > 0) {
              clearInterval(interval);
              this.allProducts = data.map(prod => {
                const category = this.categories.find(c => c.id === prod.categoryId);
                return {
                  ...prod,
                  category: category || null
                };
              });
              this.applyFilters();
            }
          }, 100);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos con descuento', err);
        this.loading = false;
      }
    });
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

  filterByCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    if (this.selectedCategoryId !== null) {
      filtered = filtered.filter(p => p.category.id === this.selectedCategoryId);
    }

    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.minPrice !== null) {
      filtered = filtered.filter(p => (p.hasDiscount ? p.finalPrice! : p.price) >= this.minPrice!);
    }

    if (this.maxPrice !== null) {
      filtered = filtered.filter(p => (p.hasDiscount ? p.finalPrice! : p.price) <= this.maxPrice!);
    }

    if (this.minPrice !== null && this.maxPrice !== null && this.minPrice > this.maxPrice) {
      this.products = [];
      return;
    }

    const getEffectivePrice = (p: Product) => p.hasDiscount ? p.finalPrice ?? p.price : p.price;

    if (this.sortOrder === 'asc') {
      filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (this.sortOrder === 'desc') {
      filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    }

    this.products = filtered;
    this.setPage(this.currentPage);


  }

  setPage(page: number) {
    this.currentPage = page;
    const start = (page - 1) * this.productsPerPage;
    const end = start + this.productsPerPage;
    this.paginatedProducts = this.products.slice(start, end);
  }

  resetFilters() {
    this.searchTerm = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortOrder = '';
    this.selectedCategoryId = null;
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.products.length / this.productsPerPage);
  }

  addToCart(product: Product) {
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    const isNew = this.cartService.addToCart(product);

    this.snackBar.open(
      isNew ? '✅ Producto agregado al carrito' : '➕ Se aumentó la cantidad',
      'Cerrar',
      {duration: 3000}
    );
  }

  verDetalle(id: number) {
    this.router.navigate(['/productos', id]);
  }


  handleAddClick(product: Product): void {
    const isRopa = product.category?.name?.trim().toLowerCase() === 'ropa';

    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('⚠️ Debes iniciar sesión para agregar al carrito.', 'Cerrar', {duration: 3000});
      this.router.navigate(['/login']);
      return;
    }

    if (isRopa) {
      this.router.navigate([`/productos/${product.id}`]);
      return;
    }

    const added = this.cartService.addToCart(product);
    this.snackBar.open(
      added ? '✅ Producto agregado al carrito.' : '➕ Se aumentó la cantidad.',
      'Cerrar',
      {duration: 3000}
    );
  }

  getDisplayPrice(product: Product): number {
    return product.hasDiscount ? product.finalPrice ?? product.price : product.price;
  }

  getButtonLabel(product: Product): string {
    if (!this.authService.isLoggedIn()) {
      return 'Agregar al carrito';
    }

    if (product.category && product.category.name.toLowerCase() === 'ropa') {
      return 'Seleccionar talla';
    }

    return 'Agregar al carrito';
  }

}
