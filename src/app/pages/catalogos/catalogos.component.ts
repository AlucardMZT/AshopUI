import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Catalog } from '../../models/catalog.model';
import { CatalogService } from '../../services/catalog.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { environment } from '../../../environments/environment';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Usar un CDN público para el worker evita problemas del bundler con `?url`.
// La versión aquí se toma de package.json (coincide con 5.4.530 en este repo).
const PDFJS_VERSION = '5.4.530';
const CDN_PDF_WORKER = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.js`;

// Asignar directamente workerSrc al CDN como opción segura y portable.
try {
  if ((pdfjsLib as any).GlobalWorkerOptions) {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = CDN_PDF_WORKER;
  }
} catch (err) {
  console.warn('No se pudo configurar pdfjs workerSrc:', err);
}

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './catalogos.component.html',
  styleUrls: ['./catalogos.component.scss']
})
export class CatalogosComponent implements OnInit {
  catalogs: Catalog[] = [];
  categories: Category[] = [];
  selectedId?: number;
  selectedIndex?: number;

  // ---------- Viewer (modal) state ----------
  viewerOpen = false;
  viewerUrl?: string;
  viewerIsPdf = false;
  viewerIsImage = false;
  viewerBlobUrl?: string;
  viewerPage = 1;
  viewerTotalPages?: number;

  // PDF.js related
  @ViewChild('pdfCanvas') pdfCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewerBody') viewerBody?: ElementRef<HTMLDivElement>;
  pdfDoc: any = null;
  renderTask: any = null;
  loadingPdf = false;

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

  // Abre el catálogo: ahora muestra un visor modal (carrusel) si es posible
  openCatalog(cat: Catalog) {
    // 1) si viene fileUrl o image, abrirlo en el viewer (modal)
    let url = cat?.fileUrl || cat?.image;
    if (url) {
      this.openInViewer(url);
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
                    this.openInViewer(remote);
                  } else {
                    alert('El servidor devolvió JSON pero no contiene la URL del catálogo.');
                  }
                } catch (e) {
                  console.error('Error parseando JSON devuelto por /catalog:', e);
                  alert('No se pudo abrir el catálogo (respuesta inesperada).');
                }
              });
            } else {
              // Asumimos que es un PDF o imagen binaria: crear URL de objeto y abrir en viewer
              const objectUrl = URL.createObjectURL(blob);
              this.viewerBlobUrl = objectUrl;
              this.openInViewer(objectUrl, type);
              // Revocar después cuando se cierre el viewer
            }
          } catch (err) {
            console.error('Error procesando blob del catálogo:', err);
            alert('Error al abrir el catálogo.');
          }
        },
        error: (err) => {
          console.warn('Error al obtener catálogo por categoría desde API:', err);
          // Fallback: abrir la URL del endpoint directamente en viewer
          const apiUrl = `${environment.apiUrl}/categories/${cat.id}/catalog`;
          this.openInViewer(apiUrl);
        }
      });
      return;
    }

    // 3) fallback: avisar al usuario
    console.warn('No hay archivo de catálogo para este elemento', cat);
    alert('No hay un archivo disponible para este catálogo.');
  }

  // Abre una URL (o objectUrl) en el modal viewer; opcionalmente se puede pasar el contentType
  private openInViewer(url: string, contentType?: string) {
    this.viewerUrl = url;
    this.viewerIsPdf = (contentType && contentType.includes('pdf')) || (url.toLowerCase().endsWith('.pdf'));
    this.viewerIsImage = url.toLowerCase().match(/\.(png|jpe?g|gif|webp)$/) !== null;
    this.viewerPage = 1;
    this.viewerOpen = true;

    // Si es PDF, cargarlo con PDF.js (esperar un tick para que el viewchild esté disponible)
    if (this.viewerIsPdf) {
      setTimeout(() => this.loadPdf(this.viewerUrl || ''), 50);
    }
  }

  closeViewer() {
    this.viewerOpen = false;
    this.viewerPage = 1;
    // Revocar object URL si lo creamos desde blob
    if (this.viewerBlobUrl) {
      try { URL.revokeObjectURL(this.viewerBlobUrl); } catch { /* ignore */ }
      this.viewerBlobUrl = undefined;
    }
    // Limpiar PDF.js
    try {
      if (this.renderTask) { try { this.renderTask.cancel(); } catch {} this.renderTask = null; }
      if (this.pdfDoc) { try { this.pdfDoc.destroy(); } catch {} this.pdfDoc = null; }
    } catch (e) { /* ignore */ }

    this.viewerUrl = undefined;
    this.viewerIsPdf = false;
    this.viewerIsImage = false;
    this.viewerTotalPages = undefined;
    this.loadingPdf = false;
  }

  // ---------------- PDF.js loading & rendering ----------------
  private async loadPdf(url: string) {
    if (!url) return;
    this.loadingPdf = true;
    try {
      // Si había un doc previo, destruirlo
      if (this.pdfDoc) { try { this.pdfDoc.destroy(); } catch {} this.pdfDoc = null; }
      const loadingTask = (pdfjsLib as any).getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.viewerTotalPages = this.pdfDoc.numPages;
      // Render primera página
      await this.renderPage(this.viewerPage);
    } catch (err) {
      console.error('Error cargando PDF en viewer:', err);
      // Fallback: mostrar mediante iframe (si el navegador lo soporta)
      this.viewerIsPdf = false;
    } finally {
      this.loadingPdf = false;
    }
  }

  private async renderPage(pageNum: number) {
    if (!this.pdfDoc) return;
    if (pageNum < 1) pageNum = 1;
    if (this.viewerTotalPages && pageNum > this.viewerTotalPages) pageNum = this.viewerTotalPages;
    this.viewerPage = pageNum;

    // Cancelar render previo
    if (this.renderTask) {
      try { this.renderTask.cancel(); } catch (e) { /* ignore */ }
      this.renderTask = null;
    }

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      // viewport al scale=1 para calcular tamaño natural
      const unscaledViewport = page.getViewport({ scale: 1 });
      const containerWidth = this.viewerBody?.nativeElement.clientWidth || Math.min(window.innerWidth * 0.9, 1100);
      // restar paddings aproximados
      const targetWidth = Math.max(200, containerWidth - 32);
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = this.pdfCanvas?.nativeElement;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      this.renderTask = page.render(renderContext);
      await this.renderTask.promise;
    } catch (err) {
      console.error('Error renderizando página del PDF:', err);
    }
  }

  // Navegación simple tipo carrusel
  prevPage() {
    if (this.viewerIsPdf && this.viewerPage > 1) {
      this.viewerPage--;
      this.renderPage(this.viewerPage);
    }
  }
  nextPage() {
    if (this.viewerIsPdf) {
      if (this.viewerTotalPages && this.viewerPage < this.viewerTotalPages) {
        this.viewerPage++;
        this.renderPage(this.viewerPage);
      } else if (!this.viewerTotalPages) {
        // intentar avanzar aunque no sepamos total
        this.viewerPage++;
        this.renderPage(this.viewerPage);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (!this.viewerOpen) return;
    if (event.key === 'ArrowLeft') {
      this.prevPage();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.nextPage();
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.closeViewer();
      event.preventDefault();
    }
  }

  // Descargar el catálogo: intenta usar fileUrl, si no hace GET con observe response para sacar filename
  downloadCatalog(cat: Catalog) {
    // Evitar comportamiento si no hay nada
    if (cat?.fileUrl) {
      // Forzar descarga usando un enlace con download
      const filename = this.sanitizeFilename(cat.title || cat.name) || this.extractFilenameFromUrl(cat.fileUrl) || 'catalogo.pdf';
      const a = document.createElement('a');
      a.href = cat.fileUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    if (cat?.id != null) {
      this.catalogService.downloadCategoryCatalog(cat.id).subscribe({
        next: (resp) => {
          const blob = resp.body as Blob;
          // Trata de obtener el filename desde Content-Disposition
          const contentDisp = resp.headers.get('Content-Disposition') || resp.headers.get('content-disposition');
          let filename = this.sanitizeFilename(cat.title || cat.name) || 'catalogo.pdf';
          if (contentDisp) {
            const match = /filename\*=UTF-8''([^;\n\r]+)/i.exec(contentDisp) || /filename="?([^";]+)"?/i.exec(contentDisp);
            if (match && match[1]) {
              filename = decodeURIComponent(match[1]);
            }
          }
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        },
        error: (err) => {
          console.error('Error al descargar catálogo:', err);
          alert('No se pudo descargar el catálogo.');
        }
      });
      return;
    }

    alert('No hay archivo disponible para descargar.');
  }

  downloadViewer() {
    if (!this.viewerUrl) return;
    try {
      const a = document.createElement('a');
      a.href = this.viewerUrl;
      a.target = '_blank';
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Error descargando desde el viewer:', e);
      // fallback: abrir en nueva pestaña
      window.open(this.viewerUrl, '_blank');
    }
  }

  private extractFilenameFromUrl(url: string): string | null {
    try {
      const parts = url.split('/');
      const last = parts.pop() || parts.pop();
      return last ? decodeURIComponent(last.split('?')[0]) : null;
    } catch { return null; }
  }

  private sanitizeFilename(name?: string | null): string | null {
    if (!name) return null;
    // Quitar caracteres indeseados y normalizar espacios; nota: el punto no necesita escape dentro de la clase
    return name.replace(/[^a-z0-9.\-_ñáéíóúÑÁÉÍÓÚ ]/gi, '').trim().replace(/\s+/g, '_') + '.pdf';
  }
}
