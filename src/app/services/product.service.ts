import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Product} from '../models/product.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getDestacados(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/destacados`);
  }

  getAllWithDiscounts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/with-discounts`);
  }

  // Devuelve los productos que pertenecen a una categoría (query param categoryId)
  getByCategory(categoryId: number): Observable<Product[]> {
    const params = new HttpParams().set('categoryId', String(categoryId));
    return this.http.get<Product[]>(this.apiUrl, { params });
  }
}
