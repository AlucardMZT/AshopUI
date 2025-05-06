import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import {MatAnchor, MatButton} from '@angular/material/button';
import { MatColumnDef, MatHeaderCell, MatCell, MatHeaderRow, MatRow, MatHeaderRowDef, MatRowDef, MatHeaderCellDef, MatCellDef, MatTable } from '@angular/material/table';
import { MatOption, MatSelect } from '@angular/material/select';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { Product } from '../../../models/product.model';
import { AdminProductService } from '../../../services/AdminProductService';


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
    MatSelect,
    MatOption,
    NgForOf,
    NgIf,
  ]
})
export class AdminProductFormComponent implements OnInit {
  productForm: FormGroup;
  imageBase64_1: string = '';
  imageBase64_2: string = '';
  imageBase64_3: string = '';

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
      categoryId: ['', Validators.required],
      stock: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
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
      categoryId: product.category.id
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
