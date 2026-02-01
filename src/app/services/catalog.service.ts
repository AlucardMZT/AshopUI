import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalog } from '../models/catalog.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  private apiUrl = `${environment.apiUrl}/catalogs`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getCatalogs(): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(this.apiUrl);
  }

  // Obtener el PDF/archivo del catálogo de una categoría (devuelve Blob)
  getCategoryCatalog(categoryId: number): Observable<Blob> {
    const url = `${environment.apiUrl}/categories/${categoryId}/catalog`;
    // Pedimos el recurso como blob para manejar PDF/imagen/binarios o JSON
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    // Es importante usar el literal 'blob' para que HttpClient devuelva Observable<Blob>
    return this.http.get(url, { headers, responseType: 'blob' as 'blob' });
  }

  // Descargar catálogo con respuesta completa (para obtener cabeceras como Content-Disposition)
  downloadCategoryCatalog(categoryId: number): Observable<HttpResponse<Blob>> {
    const url = `${environment.apiUrl}/categories/${categoryId}/catalog`;
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get(url, { headers, responseType: 'blob' as 'blob', observe: 'response' });
  }

  uploadCategoryCatalog(categoryId: number, file: File): Observable<any> {
    const url = `${environment.apiUrl}/categories/${categoryId}/catalog`;
    const form = new FormData();
    form.append('file', file);
    const token = this.authService.getToken();
    const opts: any = {};
    if (token) {
      opts.headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return this.http.post(url, form, opts);
  }

}
