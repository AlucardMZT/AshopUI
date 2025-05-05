import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import {MatAnchor, MatButton} from '@angular/material/button';
import { MatColumnDef, MatHeaderCell, MatCell, MatHeaderRow, MatRow, MatHeaderRowDef, MatRowDef, MatHeaderCellDef, MatCellDef, MatTable } from '@angular/material/table';
import { MatOption, MatSelect } from '@angular/material/select';
import { Category } from '../models/category.model';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { AdminProductService } from '../services/AdminProductService';
import {MatToolbar} from '@angular/material/toolbar';
import {RouterLink} from '@angular/router';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: { id: number; name: string };
}

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
    MatButton,
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
    MatDivider,
    MatSelect,
    MatOption,
    NgForOf,
    NgIf,
    MatToolbar,
    MatAnchor,
    RouterLink
  ]
})
export class AdminProductFormComponent implements OnInit {
  productForm: FormGroup;
  imageBase64: string = '';
  products: Product[] = [];
  editingProductId: number | null = null;
  categories: Category[] = [];
  err:any;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private adminProductService: AdminProductService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, Validators.required],
      categoryId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productForm.valid && this.imageBase64) {
      const productRequest = {
        name: this.productForm.value.name,
        description: this.productForm.value.description,
        price: this.productForm.value.price,
        categoryId: this.productForm.value.categoryId,
        image: this.imageBase64
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
      categoryId: product.category.id
    });
    this.imageBase64 = product.image;
  }

  resetForm() {
    this.editingProductId = null;
    this.productForm.reset();
    this.imageBase64 = '';
  }

  loadProducts() {
    this.adminProductService.getAllProducts().subscribe({
      next: data => this.products = data,
      error: err => console.error('Error al cargar productos', err)
    });
  }

  loadCategories() {
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
}
