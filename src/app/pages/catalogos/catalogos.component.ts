import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Catalog } from '../../models/catalog.model';
import { CatalogService } from '../../services/catalog.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { environment } from '../../../environments/environment';

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
    // 1) si viene fileUrl o image, abrirlo
    let url = cat?.fileUrl || cat?.image;
    if (url) {
      window.open(url, '_blank');
      return;
    }

    // 2) Si no hay URL directa, intentar obtener el catálogo vía API (devuelve blob)
    if (cat?.id != null) {
      this.catalogService.getCategoryCatalog(cat.id).subscribe({
        next: (blob) => {
          try {
            const type = blob && (blob as Blob).type ? (blob as Blob).type : '';
            if (type.includes('application/json')) {
              // Si el backend devolvió JSON (por ejemplo { url: '...' }), parsearlo
              (blob as Blob).text().then(text => {
                try {
                  const parsed = JSON.parse(text);
                  const remote = parsed?.url || parsed?.fileUrl || parsed?.data;
                  if (remote) {
                    window.open(remote, '_blank');
                  } else {
                    alert('El servidor devolvió JSON pero no contiene la URL del catálogo.');
                  }
                } catch (e) {
                  console.error('Error parseando JSON devuelto por /catalog:', e);
                  alert('No se pudo abrir el catálogo (respuesta inesperada).');
                }
              });
            } else {
              // Asumimos que es un PDF o imagen binaria: crear URL de objeto y abrir
              const objectUrl = URL.createObjectURL(blob);
              window.open(objectUrl, '_blank');
              // Revocar después para evitar fugas de memoria (dar tiempo a que la nueva pestaña demande el recurso)
              setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
            }
          } catch (err) {
            console.error('Error procesando blob del catálogo:', err);
            alert('Error al abrir el catálogo.');
          }
        },
        error: (err) => {
          console.warn('Error al obtener catálogo por categoría desde API:', err);
          // Fallback: abrir la URL del endpoint directamente (puede redirigir o servir el archivo)
          const apiUrl = `${environment.apiUrl}/categories/${cat.id}/catalog`;
          window.open(apiUrl, '_blank');
        }
      });
      return;
    }

    // 3) fallback: avisar al usuario
    console.warn('No hay archivo de catálogo para este elemento', cat);
    alert('No hay un archivo disponible para este catálogo.');
  }
}
