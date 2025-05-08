import {Component, OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';

import {
  MatColumnDef,
  MatHeaderCell,
  MatCell,
  MatHeaderRow,
  MatRow,
  MatHeaderRowDef,
  MatRowDef,
  MatHeaderCellDef,
  MatCellDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import { MatOption, MatSelect } from '@angular/material/select';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { Product } from '../../../models/product.model';
import { AdminProductService } from '../../../services/AdminProductService';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButton} from '@angular/material/button';
import {MatPaginator} from '@angular/material/paginator';


@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatTable,
    MatSelect,
    MatOption,
    NgForOf,
    NgIf,
    MatExpansionModule,
    MatButton,
    MatPaginator
  ]
})
export class AdminProductFormComponent implements OnInit {
  productForm: FormGroup;

  imageBase64_1 = '';
  imageBase64_2 = '';
  imageBase64_3 = '';

  products: Product[] = [];
  displayedColumns = ['name', 'description', 'price', 'stock', 'category', 'actions'];
  dataSource = new MatTableDataSource<Product>();

  selectedCategory: string = '';
  categoryNames: string[] = [];

  editingProductId: number | null = null;
  categories: Category[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private adminProductService: AdminProductService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, Validators.required],
      categoryId: ['', Validators.required],
      stock: [0, Validators.required],
      sizes: [[]]
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      const selected = this.categories.find(c => c.id === categoryId);
      this.selectedCategory = selected?.name || '';

      if (this.selectedCategory.toLowerCase().trim() !== 'ropa') {
        this.productForm.get('sizes')?.setValue([]);
      }
    });
  }

  onFileSelected(event: any, slot: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (slot === 1) this.imageBase64_1 = result;
        if (slot === 2) this.imageBase64_2 = result;
        if (slot === 3) this.imageBase64_3 = result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {

    if (this.productForm.valid && this.imageBase64_1) {
      const productRequest = {
        name: this.productForm.value.name,
        description: this.productForm.value.description,
        price: this.productForm.value.price,
        categoryId: this.productForm.value.categoryId,
        stock: this.productForm.value.stock,
        sizes: this.productForm.value.sizes,
        image: this.imageBase64_1,
        image2: this.imageBase64_2 || null,
        image3: this.imageBase64_3 || null
      };

      if (this.editingProductId) {
        this.adminProductService.update(this.editingProductId, productRequest).subscribe({
          next: () => {
            alert('Producto actualizado');
            this.resetForm();
            this.loadProducts();
          },
          error: err => {
            console.error(err);
            alert('Error al actualizar: ' + err.message);
          }
        });
      } else {
        this.adminProductService.create(productRequest).subscribe({
          next: () => {
            alert('Producto creado exitosamente');
            this.resetForm();
            this.loadProducts();
          },
          error: err => {
            console.error(err);
            alert('Error al crear: ' + err.message);
          }
        });
      }
    } else {
      alert('Formulario inválido o imagen no cargada');
    }
  }

  editProduct(product: Product) {
    this.editingProductId = product.id;

    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.category.id,
      sizes: product.sizes // ⬅️ importante
    });

    // Carga las imágenes si existen
    this.imageBase64_1 = product.image || '';
    this.imageBase64_2 = product.image2 || '';
    this.imageBase64_3 = product.image3 || '';
  }


  resetForm() {
    this.editingProductId = null;
    this.productForm.reset();
    this.imageBase64_1 = '';
  }

  loadProducts(): void {
    this.adminProductService.getAllProducts().subscribe({
      next: data => {
        this.products = data;
        this.dataSource = new MatTableDataSource<Product>(data);
        this.dataSource.paginator = this.paginator;
        this.categoryNames = [...new Set(data.map(p => p.category.name))];
        this.applyFilter(); // ✅ aplicar filtro inicial si hace falta
      },
      error: err => console.error('Error al cargar productos', err)
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: cats => this.categories = cats,
      error: err => console.error('Error cargando categorías', err)
    });
  }

  deleteProduct(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.adminProductService.delete(id).subscribe({
        next: () => {
          alert('Producto eliminado');
          this.loadProducts();
        },
        error: err => {
          console.error(err);
          alert('Error al eliminar producto: ' + err.message);
        }
      });
    }
  }


  applyFilter(event?: Event): void {
    const searchValue = event ? (event.target as HTMLInputElement).value.trim().toLowerCase() : '';

    this.dataSource.filterPredicate = (data: Product, filter: string) => {
      const [search, category] = filter.split('||');
      const matchesSearch =
        data.name.toLowerCase().includes(search) ||
        data.description.toLowerCase().includes(search) ||
        data.category?.name.toLowerCase().includes(search);

      const matchesCategory = category ? data.category?.name.toLowerCase().trim() === category.toLowerCase().trim() : true;

      return matchesSearch && matchesCategory;
    };

    const combinedFilter = `${searchValue}||${this.selectedCategory}`;
    this.dataSource.filter = combinedFilter.trim().toLowerCase();
  }

  clearImage(slot: number): void {
    if (slot === 1) this.imageBase64_1 = '';
    if (slot === 2) this.imageBase64_2 = '';
    if (slot === 3) this.imageBase64_3 = '';
  }
}
