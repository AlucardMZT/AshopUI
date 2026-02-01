import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
      next: cats => { this.categories = cats; console.debug('Categorías cargadas para catalogos:', cats); },
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

  private getCatalogRefFromCatOrCategories(cat: Catalog): { ref?: string, categoryId?: number } {
    const fromCat = (cat as any)?.catalog_pdf || (cat as any)?.catalogPdf || (cat as any)?.catalog || (cat as any)?.catalogId || (cat as any)?.fileUrl;
    if (fromCat) {
      return { ref: fromCat, categoryId: cat?.id };
    }

    if (this.categories && this.categories.length) {
      if (cat?.id != null) {
        const matchById = this.categories.find(c => c.id === cat.id) as any;
        if (matchById) {
          return { ref: matchById.catalog_pdf || matchById.fileUrl, categoryId: matchById.id };
        }
      }

      const key = (cat.title || cat.name || '').toString().trim().toLowerCase();
      if (key) {
        const matchByName = this.categories.find(c => (c.name || '').toString().trim().toLowerCase() === key) as any;
        if (matchByName) {
          return { ref: matchByName.catalog_pdf || matchByName.fileUrl, categoryId: matchByName.id };
        }
      }
    }

    return {};
  }

  async openCatalog(cat: Catalog) {
    const catalogRef = this.getCatalogRefFromCatOrCategories(cat);

    // Si la entidad trae una referencia al fichero (uuid, path o url), intentar abrir desde esa referencia primero
    const ref = catalogRef.ref;
    const foundCategoryId = catalogRef.categoryId ?? cat?.id;
    console.debug('openCatalog: ref=', ref, 'foundCategoryId=', foundCategoryId, 'cat=', cat);
    if (ref && foundCategoryId != null) {
      try {
        if (typeof ref === 'string') {
          const lowRef = ref.toLowerCase();
          if (lowRef.startsWith('http') || lowRef.startsWith('data:') || lowRef.startsWith('blob:')) {
            this.openInViewer(ref);
            return;
          }

          const candidates = this.buildRefCandidateUrls(ref, foundCategoryId);
          console.debug('openCatalog: candidatos construidos=', candidates);
          const opened = await this.tryOpenCandidates(candidates, foundCategoryId);
          console.debug('openCatalog: tryOpenCandidates result=', opened);
          if (opened) return;
        }
      } catch (err) {
        console.warn('Intento de abrir desde catalog_ref fallido, seguimos con la descarga por categoría:', err);
      }

      // Si no se pudo abrir a partir de la referencia, intentar obtener el blob desde el endpoint de categoría (usar foundCategoryId)
      this.catalogService.getCategoryCatalog(foundCategoryId).subscribe({
        next: async (blob) => {
          try {
            let type = blob && (blob as Blob).type ? (blob as Blob).type : '';
            if (!type) {
              // intentar detectar si el servidor no provee Content-Type
              const detected = await this.detectBlobMime(blob as Blob);
              if (detected) type = detected;
            }
            if (type.includes('application/json')) {
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
              const objectUrl = URL.createObjectURL(blob);
              this.viewerBlobUrl = objectUrl;
              this.openInViewer(objectUrl, type);
            }
          } catch (err) {
            console.error('Error procesando blob del catálogo (catalog_pdf):', err);
            alert('Error al abrir el catálogo.');
          }
        },
        error: (err) => {
          console.warn('Error al obtener catálogo por categoría desde API (catalog_pdf):', err);
          // Fallback: intentar abrir endpoint directamente
          const apiUrl = `${environment.apiUrl}/categories/${foundCategoryId}/catalog`;
          this.openInViewer(apiUrl);
        }
      });
      return;
    }

    let url = (cat as any)?.fileUrl || cat?.image;
    if (url) {
      this.openInViewer(url);
      return;
    }

    if (cat?.id != null) {
      const usedCategoryId = catalogRef.categoryId ?? cat.id;
      this.catalogService.getCategoryCatalog(usedCategoryId).subscribe({
        next: async (blob) => {
          try {
            let type = blob && (blob as Blob).type ? (blob as Blob).type : '';
            if (!type) {
              // intentar detectar si el servidor no provee Content-Type
              const detected = await this.detectBlobMime(blob as Blob);
              if (detected) type = detected;
            }
            if (type.includes('application/json')) {
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
          const apiUrl = `${environment.apiUrl}/categories/${usedCategoryId}/catalog`;
          this.openInViewer(apiUrl);
        }
      });
      return;
    }

    // 3) fallback: avisar al usuario
    console.warn('No hay archivo de catálogo para este elemento', cat);
    alert('No hay un archivo disponible para este catálogo.');
  }

  private openInViewer(url: string, contentType?: string) {
    this.viewerUrl = url;
    const low = (url || '').toLowerCase();
    const content = (contentType || '').toLowerCase();

    this.viewerIsPdf = Boolean(
      (content && content.includes('pdf')) ||
      low.endsWith('.pdf') ||
      low.startsWith('data:application/pdf')
    );

    this.viewerIsImage = Boolean(
      (content && content.includes('image')) ||
      low.startsWith('data:image') ||
      low.match(/\.(png|jpe?g|gif|webp)$/) !== null ||
      (low.startsWith('blob:') && content && content.includes('image'))
    );

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
    // 1) Si la categoría tiene una imagen tipo data URI, descargarla directamente
    if (cat?.image && (cat.image || '').startsWith('data:')) {
      const filename = this.sanitizeFilename(cat.title || cat.name) || 'imagen.png';
      const a = document.createElement('a');
      a.href = cat.image as string;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    // 1b) Si la categoría tiene un archivo de catálogo referenciado (catalog_pdf) y un id, intentar descargar desde la referencia
    const catalogRef = this.getCatalogRefFromCatOrCategories(cat);
    console.debug('downloadCatalog: catalogRef=', catalogRef, 'cat=', cat);
    const ref = catalogRef.ref;
    const foundCategoryId = catalogRef.categoryId ?? cat?.id;

    // Si tenemos un categoryId, forzamos primero la descarga autenticada desde el endpoint de categoría.
    if (foundCategoryId != null) {
      console.debug('downloadCatalog: forzando llamada a downloadCategoryCatalog para categoryId=', foundCategoryId);
      this.catalogService.downloadCategoryCatalog(foundCategoryId).subscribe({
        next: (resp) => {
          const blob = resp.body as Blob;
          const contentDisp = resp.headers.get('Content-Disposition') || resp.headers.get('content-disposition');
          let filename = this.sanitizeFilename(cat.title || cat.name) || 'catalogo.pdf';
          if (contentDisp) {
            const match = /filename\*=UTF-8''([^;\n\r]+)/i.exec(contentDisp) || /filename="?([^";]+)"?/i.exec(contentDisp);
            if (match && match[1]) {
              try { filename = decodeURIComponent(match[1]); } catch { filename = match[1]; }
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
          console.debug('downloadCatalog: descarga autenticada falló o no existe archivo en endpoint, err=', err);
          // Si fallo autenticado, intentar fallback con referencia o rutas públicas
          if (ref && typeof ref === 'string') {
            const lowRef = ref.toLowerCase();
            if (lowRef.startsWith('http') || lowRef.startsWith('data:') || lowRef.startsWith('blob:')) {
              const filename = this.sanitizeFilename(cat.title || cat.name) || this.extractFilenameFromUrl(ref) || 'catalogo.pdf';
              const a = document.createElement('a');
              a.href = ref;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              return;
            }

            const candidates = this.buildRefCandidateUrls(ref, foundCategoryId);
            console.debug('downloadCatalog: candidatos para descarga=', candidates);
            this.tryDownloadFromCandidates(candidates, this.sanitizeFilename(cat.title || cat.name) || 'catalogo.pdf');
            return;
          }
          // último fallback: intentar endpoint por categoría (sin observe) para abrir en nueva pestaña
          const apiUrl = `${environment.apiUrl}/categories/${foundCategoryId}/catalog`;
          window.open(apiUrl, '_blank');
        }
      });
      return;
    }

    // Si no hay categoryId, pero hay una referencia directa, intentar descargar desde ella
    if (ref && typeof ref === 'string') {
      const lowRef = ref.toLowerCase();
      if (lowRef.startsWith('http') || lowRef.startsWith('data:') || lowRef.startsWith('blob:')) {
        const filename = this.sanitizeFilename(cat.title || cat.name) || this.extractFilenameFromUrl(ref) || 'catalogo.pdf';
        const a = document.createElement('a');
        a.href = ref;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const candidates = this.buildRefCandidateUrls(ref, undefined);
      this.tryDownloadFromCandidates(candidates, this.sanitizeFilename(cat.title || cat.name) || 'catalogo.pdf');
      return;
    }

    // 2) Si no hay referencia, intentar descargar por categoría (catalog_pdf)
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
              try { filename = decodeURIComponent(match[1]); } catch { filename = match[1]; }
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

    // 3) fallback: intentar abrir directamente fileUrl si existe
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

  // Helper: intenta detectar el MIME type de un Blob leyendo los primeros bytes.
  private async detectBlobMime(blob: Blob): Promise<string> {
    try {
      const buffer = await blob.slice(0, 16).arrayBuffer();
      const arr = new Uint8Array(buffer);
      // PDF: starts with '%PDF'
      if (arr.length >= 4 && arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) return 'application/pdf';
      // PNG: 89 50 4E 47
      if (arr.length >= 4 && arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) return 'image/png';
      // JPG: FF D8 FF
      if (arr.length >= 3 && arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) return 'image/jpeg';
      // GIF: 'GIF8'
      if (arr.length >= 4 && arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) return 'image/gif';
      // WEBP: 'RIFF' ... 'WEBP'
      if (arr.length >= 12 && arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 && arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) return 'image/webp';
      return '';
    } catch (e) {
      return '';
    }
  }

  // Construye un array de URLs candidatas basadas en la referencia almacenada (uuid o nombre)
  private buildRefCandidateUrls(ref: string, categoryId?: number): string[] {
    const base = environment.apiUrl.replace(/\/$/, '');
    const candidates = [] as string[];
    // 1) ref tal cual si parece una URL
    if (ref.startsWith('http') || ref.startsWith('data:') || ref.startsWith('blob:')) candidates.push(ref);
    // 2) endpoint común para servir archivos por referencia
    candidates.push(`${base}/files/${ref}`);
    candidates.push(`${base}/uploads/${ref}`);
    // rutas alternativas que a veces usan subcarpetas o nombres distintos
    candidates.push(`${base}/uploads/catalogs/${ref}`);
    candidates.push(`${base}/public/files/${ref}`);
    // 3) endpoint por categoría (ya existente)
    if (categoryId != null) candidates.push(`${base}/categories/${categoryId}/catalog`);
    // 4) otros posibles endpoints (por si la API usa rutas distintas)
    candidates.push(`${base}/catalogs/${ref}`);
    candidates.push(`${base}/storage/${ref}`);
    return candidates;
  }

  // Intenta abrir la primera URL válida entre las candidatas (usa HEAD para comprobar existencia cuando sea posible)
  private async tryOpenCandidates(candidates: string[], categoryId?: number): Promise<boolean> {
    console.debug('tryOpenCandidates: candidates=', candidates, 'categoryId=', categoryId);
     // Si tenemos categoryId, intentar primero el endpoint autenticado que devuelve el blob
     if (categoryId != null) {
       try {
         const blob = await firstValueFrom(this.catalogService.getCategoryCatalog(categoryId));
         if (blob) {
           // Detectar tipo y abrir en viewer
           let type = (blob as Blob).type || '';
           if (!type) {
             const detected = await this.detectBlobMime(blob as Blob);
             if (detected) type = detected;
           }
           const objectUrl = URL.createObjectURL(blob);
           console.debug('tryOpenCandidates: obtuve blob autenticado, objectUrl=', objectUrl, 'type=', type);
           this.viewerBlobUrl = objectUrl;
           this.openInViewer(objectUrl, type);
           return true;
         }
       } catch (e) {
         // Si falla (403/401/CORS), continuar con el intento de fetch directo a candidatos
         console.debug('Intento autenticado por categoryId falló, probando candidatos públicos', e);
       }
     }
     for (const url of candidates) {
       if (!url) continue;
       try {
         console.debug('tryOpenCandidates: comprobando candidato', url);
         // Intentar HEAD para comprobar que el recurso existe y evitar abrir 404 en viewer (puede fallar por CORS)
         let ok = false;
         try {
           const resp = await fetch(url, { method: 'HEAD' });
           ok = resp && resp.ok;
         } catch (_) {
           // Si HEAD falla por CORS, intentar GET pero sin leer body
           try {
             const resp2 = await fetch(url, { method: 'GET' });
             ok = resp2 && (resp2.ok || resp2.type === 'opaque');
           } catch (__) {
             ok = false;
           }
         }
         if (ok) {
           this.openInViewer(url);
           return true;
         }
       } catch (e) {
         // ignorar y probar siguiente candidato
         console.debug('Falló comprobación de candidato', url, e);
       }
     }
     return false;
   }

  // Intenta descargar desde la primera URL candidata; si ninguna existe, no muestra error (se espera fallback posterior)
  private async tryDownloadFromCandidates(candidates: string[], filename: string) {
    for (const url of candidates) {
      if (!url) continue;
      try {
        try {
          const head = await fetch(url, { method: 'HEAD' });
          if (!head.ok) throw new Error('no ok');
        } catch (_) {
          // intentar GET si HEAD no es posible
          try {
            const get = await fetch(url, { method: 'GET' });
            if (!get.ok && get.type !== 'opaque') throw new Error('no ok get');
          } catch (__) {
            throw new Error('no existe');
          }
        }

        // Si llegamos aquí, el recurso parece accesible -> crear enlace para descargar
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } catch (e) {
        // ignorar y probar siguiente
        console.debug('Intento de descarga fallido para', url, e);
      }
    }
  }
}
