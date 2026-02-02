import { Component, OnInit } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {Catalog} from '../../models/catalog.model';
import {CatalogService} from '../../services/catalog.service';
import { CategoryService } from '../../services/category.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {CarouselModule} from 'ngx-owl-carousel-o';
import {MatButton} from '@angular/material/button';


@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, MatCardModule, CarouselModule, MatButton],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss']
})
export class CatalogoComponent implements OnInit {
  categories: Catalog[] = [];

  carouselOptions = {
    loop: true,
    margin: 10,
    nav: true,
    dots: false,
    responsive: {
      0: { items: 1 },
      600: { items: 2 },
      960: { items: 3 },
      1200: { items: 4 }
    }
  };

  // Máximo de páginas a renderizar por catálogo (evita consumos excesivos)
  private MAX_PAGES_PER_CATALOG = 6;

  constructor(private catalogService: CatalogService, private categoryService: CategoryService) {}

  // Configurar worker de pdfjs desde CDN para evitar problemas de bundling
  private configurePdfWorker() {
    try {
      const ver = (pdfjsLib as any).version || '2.16.105';
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/legacy/build/pdf.worker.min.js`;
    } catch (e) {
      console.warn('No se pudo configurar worker de pdfjs', e);
    }
  }

  ngOnInit(): void {
    this.configurePdfWorker();
    this.catalogService.getCatalogs().subscribe({
      next: (data: Catalog[]) => {
        this.categories = data;
        for (const section of this.categories) {
          this.tryPopulateSectionFromPdf(section);
        }
      },
      error: (err: HttpErrorResponse) => console.error('Error al cargar catálogos', err)
    });
  }

  public async tryPopulateSectionFromPdf(section: Catalog) {
      if (!section) return;
      console.debug('tryPopulateSectionFromPdf called for section', section?.id, section?.title || section?.name);
      const catId = section.id;
     if (section.products && section.products.length) return;

     try { section.loadingPdf = true; } catch {}

     // Si falta metadata (catalog_pdf/fileUrl), intentar obtener la categoría por id para refrescar
     if (catId != null && !section.catalog_pdf && !section.fileUrl) {
       try {
         const fresh = await firstValueFrom(this.categoryService.getById(catId));
         if (fresh) {
           // Copiar valores relevantes si existen
           try { section.catalog_pdf = (fresh as any).catalog_pdf || (fresh as any).catalogPdf || section.catalog_pdf; } catch {}
           try { section.fileUrl = (fresh as any).fileUrl || section.fileUrl; } catch {}
         }
       } catch (e) {
         console.debug('No se pudo obtener categoría por id en tryPopulateSectionFromPdf', catId, e);
       }
     }

     if (catId != null) {
       // Intentar endpoint autenticado por categoría
       this.catalogService.getCategoryCatalog(catId).subscribe({
         next: async (blob) => {
           try {
             // Intentar convertir blob PDF a imágenes
             const imgs = await this.renderPdfBlobToImages(blob, this.MAX_PAGES_PER_CATALOG);
             if (imgs && imgs.length) {
               // Crear productos dummy a partir de las imágenes
               section.products = imgs.map((img, idx) => ({
                 id: idx + 1,
                 name: `${section.title || section.name || 'Catálogo'} - pág ${idx + 1}`,
                 price: 0,
                 image: img,
                 description: '',
                 stock: 0,
                 size: '' ,
                 category: { id: section.id || 0, name: section.title || section.name || '' }
               } as any));
              console.debug('PDF procesado para section', section.id, 'generadas imágenes:', imgs.length);
             }
           } catch (e) {
             console.error('Error procesando PDF para section', section, e);
           } finally {
             section.loadingPdf = false;
             // trigger change detection by reassigning (not estrictly necesario but safe)
             section.products = section.products || [];
           }
         },
         error: (err) => {
           // Si falla el endpoint autenticado, intentar si existe una fileUrl pública (section.fileUrl)
           console.debug('No se pudo obtener PDF por category endpoint, intentando fileUrl Si existe', section.id, err);if (section.fileUrl && (section.fileUrl.toLowerCase().endsWith('.pdf') || section.fileUrl.toLowerCase().includes('pdf'))) {
             fetch(section.fileUrl).then(r => r.blob()).then(async blob => {
               try {
                 const imgs = await this.renderPdfBlobToImages(blob, this.MAX_PAGES_PER_CATALOG);
                 if (imgs && imgs.length) {
                   section.products = imgs.map((img, idx) => ({
                     id: idx + 1,
                     name: `${section.title || section.name || 'Catálogo'} - pág ${idx + 1}`,
                     price: 0,
                     image: img,
                     description: '',
                     stock: 0,
                     size: '',
                     category: { id: section.id || 0, name: section.title || section.name || '' }
                   } as any));
                   console.debug('PDF procesado desde fileUrl para section', section.id, 'generadas imágenes:', imgs.length);
                 }
               } catch (e) { console.error('Error procesando PDF desde fileUrl', e); }
               finally { section.loadingPdf = false; }
             }).catch(e => { console.debug('No se pudo descargar fileUrl para section', section, e); section.loadingPdf = false; });
           } else {
             console.debug('No hay fileUrl pdf para section', section.id);
            // Intentar usar la referencia catalog_pdf (uuid/path) como fallback
            const ref = section.catalog_pdf || (section as any)?.catalogPdf || (section as any)?.catalog || section.fileUrl;
            if (ref) {
              console.debug('Intentando descargar usando catalog_pdf ref=', ref);
              this.tryFetchBlobFromCatalogRef(ref, section.id).then(async blob => {
                if (blob) {
                  try {
                    const imgs = await this.renderPdfBlobToImages(blob, this.MAX_PAGES_PER_CATALOG);
                    if (imgs && imgs.length) {
                      section.products = imgs.map((img, idx) => ({
                        id: idx + 1,
                        name: `${section.title || section.name || 'Catálogo'} - pág ${idx + 1}`,
                        price: 0,
                        image: img,
                        description: '',
                        stock: 0,
                        size: '',
                        category: { id: section.id || 0, name: section.title || section.name || '' }
                      } as any));
                      console.debug('PDF procesado desde catalog_pdf ref para section', section.id, 'generadas imágenes:', imgs.length);
                    }
                  } catch (e) { console.error('Error procesando PDF descargado desde catalog_pdf', e); }
                } else {
                  console.debug('No se obtuvo blob desde catalog_pdf ref para section', section.id);
                }
                section.loadingPdf = false;
              }).catch(e => { console.debug('Error intentando descargar desde catalog_pdf', e); section.loadingPdf = false; });
            } else {
              section.loadingPdf = false;
            }
           }
         }
       });
     }
     else {
       // No tiene categoryId
       section.loadingPdf = false;
     }

    // end tryPopulateSectionFromPdf
  }

   // Renderiza las primeras páginas de un blob PDF a data URLs (PNG)
   private async renderPdfBlobToImages(blob: Blob, maxPages: number): Promise<string[]> {
    // Validaciones básicas
    if (!blob || blob.size === 0) return [];

    // Detectar si el blob parece un PDF (por tipo MIME o por cabecera "%PDF")
    let looksLikePdf = false;
    try {
      const type = (blob.type || '').toLowerCase();
      if (type.includes('pdf')) {
        looksLikePdf = true;
      } else {
        // Leer los primeros bytes y buscar la cabecera %PDF
        const head = await blob.slice(0, 5).arrayBuffer();
        const headStr = new TextDecoder().decode(head);
        if (headStr.startsWith('%PDF')) looksLikePdf = true;
      }
    } catch (e) {
      // Si falló la detección, seguiremos e intentaremos procesarlo de todos modos
      console.debug('No se pudo detectar tipo de blob, intentando procesar', e);
    }

    if (!looksLikePdf) {
      console.debug('El blob no parece un PDF. Abortando renderizado.');
      return [];
    }

    // Pasar los datos como ArrayBuffer/Uint8Array; evita problemas con object URLs en algunos entornos
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const loadingTask = (pdfjsLib as any).getDocument({ data: uint8 });
    const pdfDoc = await loadingTask.promise;
    const total = pdfDoc.numPages || 0;
    const limit = Math.min(maxPages, total);
    const results: string[] = [];
    for (let p = 1; p <= limit; p++) {
      try {
        const page = await pdfDoc.getPage(p);
        // Escalar para obtener buena resolución (ajustable)
        const viewport = page.getViewport({ scale: 1.5 });

        // Intentar usar OffscreenCanvas si está disponible (mejor rendimiento en web workers)
        let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
        try {
          if (typeof (globalThis as any).OffscreenCanvas !== 'undefined') {
            canvas = new (globalThis as any).OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
          } else {
            const c = document.createElement('canvas');
            c.width = Math.floor(viewport.width);
            c.height = Math.floor(viewport.height);
            canvas = c;
          }
        } catch {
          const c = document.createElement('canvas');
          c.width = Math.floor(viewport.width);
          c.height = Math.floor(viewport.height);
          canvas = c;
        }

        // Obtener contexto 2D (para OffscreenCanvas en algunos navegadores se usa getContext igual)
        const ctx = (canvas as any).getContext ? (canvas as any).getContext('2d') : null;
        if (!ctx) {
          console.debug('No se pudo obtener contexto 2D para la página', p);
          continue;
        }

        const renderContext = { canvasContext: ctx, viewport };
        const renderTask = page.render(renderContext as any);
        await renderTask.promise;

        // Convertir a data URL; OffscreenCanvas no implementa toDataURL en algunos navegadores, así que convertimos a Blob primero
        let dataUrl: string;
        if ((canvas as any).convertToBlob) {
          const blobOut = await (canvas as any).convertToBlob('image/png');
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blobOut);
          });
        } else {
          // HTMLCanvasElement soporta toDataURL
          dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');
        }

        results.push(dataUrl);
      } catch (e) {
        console.debug('Error renderizando página', p, e);
      }
    }

    try {
      // Cerrar / destruir documento para liberar memoria
      try { if (typeof (pdfDoc as any).destroy === 'function') (pdfDoc as any).destroy(); else if (typeof (pdfDoc as any).close === 'function') (pdfDoc as any).close(); } catch {}
    } catch (_) {}
    return results;
  }

  // Fallback: probar descargar blob a partir de la referencia catalog_pdf (uuid/path) mediante URLs candidatas públicas
  private async tryFetchBlobFromCatalogRef(ref: string, categoryId?: number): Promise<Blob | null> {
    if (!ref) return null;
    const base = environment.apiUrl.replace(/\/$/, '');
    const candidates = [
      `${base}/files/${ref}`,
      `${base}/uploads/${ref}`,
      `${base}/uploads/catalogs/${ref}`,
      `${base}/public/files/${ref}`,
      `${base}/catalogs/${ref}`,
      `${base}/storage/${ref}`
    ];

    // Si se proporcionó categoryId, intentar endpoint por categoría también
    if (categoryId != null) candidates.unshift(`${base}/categories/${categoryId}/catalog`);

    for (const url of candidates) {
      try {
        const resp = await fetch(url);
        if (resp && resp.ok) {
          const contentType = resp.headers.get('content-type') || '';
          // verificar que no sea JSON inesperado
          if (contentType.includes('application/json')) {
            // intentar parsear JSON con url
            try {
              const parsed = await resp.json();
              const remote = parsed?.url || parsed?.fileUrl;
              if (remote) {
                const r2 = await fetch(remote);
                if (r2 && r2.ok) return await r2.blob();
              }
            } catch { /* ignore */ }
            continue;
          }
          return await resp.blob();
        }
      } catch (e) {
        console.debug('tryFetchBlobFromCatalogRef fallo candidat0', url, e);
        continue;
      }
    }
    return null;
  }
}
