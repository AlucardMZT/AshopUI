import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
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
}
