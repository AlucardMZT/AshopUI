import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private baseUrl = `${environment.apiUrl}/dashboard-a-shop-ctrl-984/products`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/allproducts`);
  }

  create(product: any): Observable<string> {
    const token = this.authService.getToken();
    return this.http.post(`${this.baseUrl}`, product, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  update(id: number, product: any): Observable<string> {
    const token = this.authService.getToken();
    return this.http.put(`${this.baseUrl}/${id}`, product, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  delete(id: number): Observable<string> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }
}
