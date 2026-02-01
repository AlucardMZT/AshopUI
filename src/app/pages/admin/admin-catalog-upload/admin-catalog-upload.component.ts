import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CategoryService } from '../../../services/category.service';
import { CatalogService } from '../../../services/catalog.service';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-admin-catalog-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './admin-catalog-upload.component.html',
  styleUrls: ['./admin-catalog-upload.component.scss']
})
export class AdminCatalogUploadComponent implements OnInit {
  categories: Category[] = [];
  selectedCategoryId?: number;
  file?: File;
  uploading = false;

  constructor(private categoryService: CategoryService, private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: cats => this.categories = cats,
      error: err => {
        console.error('Error cargando categorías en admin upload:', err);
        alert('Error al cargar categorías');
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
    } else {
      this.file = undefined;
    }
  }

  upload() {
    if (!this.selectedCategoryId) { alert('Selecciona una categoría'); return; }
    if (!this.file) { alert('Selecciona un archivo'); return; }

    this.uploading = true;
    this.catalogService.uploadCategoryCatalog(this.selectedCategoryId, this.file).subscribe({
      next: () => {
        alert('Archivo subido correctamente');
        this.file = undefined;
        (document.getElementById('catalog-file') as HTMLInputElement).value = '';
        this.uploading = false;
      },
      error: err => {
        console.error('Error subiendo catálogo:', err);
        alert('Error al subir archivo');
        this.uploading = false;
      }
    });
  }
}
