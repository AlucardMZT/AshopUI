import { Component, OnInit } from '@angular/core';
import {Product} from '../../models/product.model';
import {MatCard, MatCardActions, MatCardContent, MatCardImage} from '@angular/material/card';
import {NgClass, NgForOf, NgIf} from '@angular/common';
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
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService
  ) {}

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
    this.productService.getAll().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.loading = false;
      }
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => console.error('Error cargando categorías', err)
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
      filtered = filtered.filter(p => p.price >= this.minPrice!);
    }

    if (this.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= this.maxPrice!);
    }

    if (this.minPrice !== null && this.maxPrice !== null && this.minPrice > this.maxPrice) {
      this.products = [];
      return;
    }

    if (this.sortOrder === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortOrder === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
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
      { duration: 3000 }
    );
  }

  verDetalle(id: number) {
    this.router.navigate(['/productos', id]);
  }
}
