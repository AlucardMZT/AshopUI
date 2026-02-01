import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Catalog } from '../../models/catalog.model';
import { CatalogService } from '../../services/catalog.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './catalogos.component.html',
  styleUrls: ['./catalogos.component.scss']
})
export class CatalogosComponent implements OnInit {
  catalogs: Catalog[] = [];
  categories: Category[] = []; // categorías del home para reutilizar sus imágenes
  selectedId?: number; // id del catálogo seleccionado para el estilo visual
  selectedIndex?: number; // fallback si no hay id

  constructor(private catalogService: CatalogService, private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.catalogService.getCatalogs().subscribe({
      next: (data: Catalog[]) => this.catalogs = data,
      error: (err: HttpErrorResponse) => console.error('Error al cargar catálogos', err)
    });
    // Cargar las categorías para poder reutilizar sus imágenes (misma fuente que en Home)
    this.categoryService.getAll().subscribe({
      next: cats => this.categories = cats,
      error: err => console.error('Error al cargar categorías para catalogos', err)
    });
  }

  // Selecciona visualmente y abre el catálogo
  selectCatalog(cat: Catalog, index?: number) {
    if (cat?.id != null) {
      this.selectedId = cat.id;
      this.selectedIndex = undefined;
    } else if (index != null) {
      this.selectedIndex = index;
      this.selectedId = undefined;
    }
    this.openCatalog(cat);
  }

  isSelected(cat: Catalog, index?: number) {
    if (cat && cat.id != null) {
      return this.selectedId === cat.id;
    }
    // fallback: comparar por índice
    if (index != null) {
      return this.selectedIndex === index;
    }
    return false;
  }

  getImage(cat: Catalog): string {
    if (cat?.image) return cat.image;
    const key = (cat.title || cat.name || '').toString().trim().toLowerCase();
    if (this.categories && this.categories.length) {
      const matchById = cat?.id != null ? this.categories.find(c => c.id === cat.id) : undefined;
      if (matchById && matchById.image) return matchById.image;
      if (key) {
        const matchByName = this.categories.find(c => (c.name || '').toString().trim().toLowerCase() === key);
        if (matchByName && matchByName.image) return matchByName.image;
      }
    }
    if (cat?.products && cat.products.length > 0 && (cat.products[0] as any).image) return (cat.products[0] as any).image;

    if (cat?.fileUrl && (cat.fileUrl.endsWith('.png') || cat.fileUrl.endsWith('.jpg') || cat.fileUrl.endsWith('.jpeg'))) return cat.fileUrl;
    return 'assets/FOLLETO-C21.png';
  }

  openCatalog(cat: Catalog) {
    const url = cat?.fileUrl || cat?.image;
    if (url) {
      // Abrir en nueva pestaña
      window.open(url, '_blank');
    } else {
      console.warn('No hay archivo de catálogo para este elemento', cat);
      alert('No hay un archivo disponible para este catálogo.');
    }
  }
}
