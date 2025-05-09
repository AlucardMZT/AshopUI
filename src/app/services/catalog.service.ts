import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalog } from '../models/catalog.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  private apiUrl = `${environment.apiUrl}/catalogs`;

  constructor(private http: HttpClient) {}

  getCatalogs(): Observable<Catalog[]> {
    return this.http.get<Catalog[]>(this.apiUrl);
  }
}
