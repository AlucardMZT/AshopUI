import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalog } from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private apiUrl = 'http://localhost:8080/api/catalogs';

  constructor(private http: HttpClient) {}

  getCatalogs(): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(this.apiUrl);
  }
}
