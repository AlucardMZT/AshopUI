import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {CategoryDiscountRequestModel} from '../../../models/CategoryDiscountRequest.model';
import {DiscountService} from '../../../services/DiscountService';
import {MatDivider, MatList, MatListItem} from '@angular/material/list';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {CategoryService} from '../../../services/category.service';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {ProductDiscountRequest} from '../../../models/ProductDiscountRequest.model';
import {ProductDiscountService} from '../../../services/ProductDiscountService';
import {Category} from '../../../models/category.model';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatChip} from '@angular/material/chips';
import {Product} from '../../../models/product.model';
import {ProductService} from '../../../services/product.service';

@Component({
  selector: 'app-admin-discount-manager',
  standalone: true,
  templateUrl: './admin-discount-manager.component.html',
  styleUrl: './admin-discount-manager.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    FormsModule,

    MatDatepicker,
    MatDatepickerToggle,
    MatDatepickerInput,
    MatNativeDateModule,
    MatTabGroup,
    MatTab,
    MatChip
  ]
})


export class AdminDiscountManagerComponent implements OnInit {
  categoryDiscount: CategoryDiscountRequestModel = {} as CategoryDiscountRequestModel;
  productDiscount: ProductDiscountRequest = {} as ProductDiscountRequest;
  categories: Category[] = [];
  editing: boolean = false;
  editingId: number | null = null;
  productosConDescuento: any[] = [];
  columnasDescuento: string[] = ['name', 'originalPrice', 'finalPrice', 'hasDiscount', 'acciones'];
  productosRestaurados: any[] = [];
  productos: Product[] = [];

  constructor(
    private discountService: DiscountService,
    private productDiscountService: ProductDiscountService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {

    this.loadCategories()
    this.loadProductosConDescuento();
    this.loadProductos();
  }

  saveCategoryDiscount(): void {
    if (!this.categoryDiscount.description) {
      this.mostrarNotificacion('El motivo es obligatorio');
      return;
    }

    this.discountService.create(this.categoryDiscount).subscribe({
      next: () => {
        this.mostrarNotificacion('Descuento aplicado correctamente');
        this.categoryDiscount = {} as CategoryDiscountRequestModel;
        this.loadProductosConDescuento();
      },
      error: err => {
        console.error('Error real del backend:', err);
        this.mostrarNotificacion('Error al aplicar descuento');
      }
    });
  }

  aplicarAhoraCategoria(): void {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const adjustDate = (date: Date) => {
      const offset = date.getTimezoneOffset(); // en minutos
      const localISO = new Date(date.getTime() - offset * 60 * 1000).toISOString();
      return localISO.substring(0, 10); // solo "YYYY-MM-DD"
    };

    this.categoryDiscount.startDate = adjustDate(today);
    this.categoryDiscount.endDate = adjustDate(tomorrow);
  }

  saveProductDiscount(): void {
    this.productDiscountService.create(this.productDiscount).subscribe({
      next: () => {
        alert('Descuento por producto aplicado');
        this.productDiscount = {} as ProductDiscountRequest;
      },
      error: err => {
        alert(err.error || 'Error al aplicar descuento al producto');
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: cats => this.categories = cats,
      error: err => console.error('Error cargando categorías', err)
    });
  }

  loadProductosConDescuento(): void {
    this.discountService.getProductosConDescuento().subscribe({
      next: productos => {
        this.productosConDescuento = productos.filter(p => p.hasDiscount);
        this.productosRestaurados = productos.filter(p => !p.hasDiscount);
      },
      error: err => console.error('Error al cargar productos', err)
    });
  }

  eliminarDescuento(product: any): void {
    if (product.discountSource === 'PRODUCT') {
      this.productDiscountService.delete(product.discountId).subscribe(() => {
        alert('Descuento individual eliminado');
        this.loadProductosConDescuento();
      });
    } else if (product.discountSource === 'CATEGORY') {
      this.discountService.delete(product.discountId).subscribe(() => {
        alert('Descuento de categoría eliminado');
        this.loadProductosConDescuento();
      });
    } else {
      alert('Este producto no tiene un descuento eliminable.');
    }
  }

  mostrarNotificacion(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000
    });
  }

  editDiscount(p: any): void {
    if (p.discountSource === 'CATEGORY') {
      this.categoryDiscount = {
        categoryId: p.categoryId,
        percentage: p.discountPercentage,
        startDate: p.startDate,
        endDate: p.endDate,
        description: p.description
      };
      this.editing = true;
      this.editingId = p.discountId;
    } else {
      this.mostrarNotificacion('Solo se puede editar descuentos por categoría desde aquí.');
    }
  }

  loadProductos(): void {
    this.productService.getAll().subscribe({
      next: productos => {
        this.productos = productos;
      },
      error: err => console.error('Error cargando productos', err)
    });
  }
}

