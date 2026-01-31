import {Component, OnInit} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CategoryService} from '../../../services/category.service';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatExpansionModule} from '@angular/material/expansion';
import {ProductService} from '../../../services/product.service';
import {Product} from '../../../models/product.model';
import {MatChipsModule} from '@angular/material/chips';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RelatedProductsDialogComponent } from '../related-products-dialog/related-products-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-categoria-image-list',
  imports: [CommonModule, MatExpansionModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelect, MatOption, MatExpansionPanel, MatExpansionPanelTitle, MatAccordion, MatChipsModule, MatDialogModule],

  templateUrl: './categoria-image-list.component.html',
  styleUrl: './categoria-image-list.component.scss'
})
export class CategoriaImageListComponent implements OnInit {
  categories: any[] = [];
  realCategories: any[] = [];
  promotionalCategories: any[] = [];
  categoryForm!: FormGroup;
  editingId: number | null = null;
  imageBase64: string = '';
  relatedProducts: Product[] = [];
  showRelatedFor: number | null = null;

  constructor(private fb: FormBuilder, private categoryService: CategoryService,  private snackBar: MatSnackBar, private productService: ProductService, private router: Router, private dialog: MatDialog, private authService: AuthService) {}

  ngOnInit() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      image: [''],
      type: ['promocional']
    });
    this.refreshCategories();
  }

  refreshCategories() {
    this.categoryService.getAll().subscribe(cats => {
      // añadimos flags por cada categoría
      this.promotionalCategories = cats.filter(c => c.type === 'promocional');
      this.realCategories = cats.filter(c => c.type === 'real');

      // comprobar productos relacionados para cada categoría (marca hasProducts y productCount)
      this.checkProductsForCategories(this.promotionalCategories);
      this.checkProductsForCategories(this.realCategories);
    });
  }

  // Revisa para cada categoría si existe al menos un producto y guarda el conteo
  private checkProductsForCategories(catArray: any[]) {
    catArray.forEach(cat => {
      cat.hasProducts = false;
      cat.productCount = 0;
      if (!cat || !cat.id) return;
      this.productService.getByCategory(cat.id).subscribe({
        next: products => {
          cat.productCount = products?.length || 0;
          cat.hasProducts = (products && products.length > 0);
        },
        error: () => {
          // en caso de error dejamos hasProducts = false
          cat.hasProducts = false;
          cat.productCount = 0;
        }
      });
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.imageBase64 = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  saveCategory() {
    const data = { ...this.categoryForm.value, image: this.imageBase64 };
    if (this.editingId) {
      this.categoryService.update(this.editingId, data).subscribe(() => {
        this.snackBar.open('✅ Categoría actualizada', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.refreshCategories();
      });
    } else {
      this.categoryService.create(data).subscribe(() => {
        this.snackBar.open('✅ Categoría creada', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.refreshCategories();
      });
    }
  }

  editCategory(cat: any) {
    this.editingId = cat.id;
    this.categoryForm.patchValue(cat);
    this.imageBase64 = cat.image;
  }

  resetForm() {
    this.editingId = null;
    this.categoryForm.reset({ type: 'promocional' });
    this.imageBase64 = '';
  }

  deleteCategory(id: number, force: boolean = false) {
    if (!confirm(force ? '¿Forzar eliminación de la categoría? Esto eliminará o actualizará productos relacionados.' : '¿Seguro de eliminar?')) return;

    this.categoryService.delete(id, force).subscribe({
      next: () => {
        this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
        this.refreshCategories();
      },
      error: (err) => {
        console.error('Error al eliminar categoría', err);
        const msg = err?.error?.message || err?.error || err?.message || 'Error al eliminar la categoría';
        // Si es 403 -> falta permiso
        if (err?.status === 403) {
          // Si no está logueado, pedir login
          if (!this.authService.isLoggedIn()) {
            const sb = this.snackBar.open('No estás autenticado. Inicia sesión con una cuenta ADMIN.', 'Ir a login', { duration: 8000 });
            sb.onAction().subscribe(() => this.router.navigate(['/login']));
            return;
          }

          // Si está logueado pero no es ADMIN, pedir login/recambio de cuenta
          if (!this.authService.isAdmin()) {
            const sb = this.snackBar.open('Necesitas permisos ADMIN para esta acción. Inicia sesión con una cuenta ADMIN.', 'Ir a login', { duration: 8000 });
            sb.onAction().subscribe(() => this.router.navigate(['/login']));
            return;
          }

          // Si está logueado y es ADMIN pero el servidor devuelve 403, puede ser token inválido/expirado
          const sb = this.snackBar.open('Operación denegada por el servidor (403). ¿Cerrar sesión y reintentar?', 'Cerrar sesión', { duration: 10000 });
          sb.onAction().subscribe(() => {
            this.authService.logout();
          });
          return;
        }
        if (String(msg).toLowerCase().includes('productos') || err.status === 409 || err.status === 400) {
          const dialogRef = this.dialog.open(RelatedProductsDialogComponent, {
            width: '900px',
            data: { categoryId: id, categoryName: this.getCategoryName(id) }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result && result.force) {
              // Antes de forzar, comprobar permisos
              if (!this.authService.isAdmin()) {
                const sb2 = this.snackBar.open('No tienes permisos de ADMIN para forzar la eliminación. Inicia sesión con una cuenta ADMIN.', 'Ir a login', { duration: 8000 });
                sb2.onAction().subscribe(() => this.router.navigate(['/login']));
              } else {
                // El usuario es admin -> proceder a forzar eliminación
                this.deleteCategory(id, true);
              }
            }
          });
        } else {
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
        }
      }
    });
  }

  showRelatedProducts(categoryId: number) {
    // Abrir modal paginado con productos relacionados
    const dialogRef = this.dialog.open(RelatedProductsDialogComponent, {
      width: '900px',
      data: { categoryId: categoryId, categoryName: this.getCategoryName(categoryId) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.force) {
        // Si el diálogo devolvió la intención de forzar, proceder
        this.deleteCategory(categoryId, true);
      }
    });
  }

  getCategoryName(id: number | null): string {
    if (!id) return '';
    const all = [...this.promotionalCategories, ...this.realCategories];
    const found = all.find((c: any) => c.id === id);
    return found?.name || '';
  }

  // Método para manejar acción de editar producto desde la lista relacionada
  editProduct(product: Product) {
    // Navegar al panel admin de productos y pasar query param para abrir edición
    this.router.navigate(['/a-shop-ctrl-984-panel', 'productos'], { queryParams: { edit: product.id } });
  }
}
