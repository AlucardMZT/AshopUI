import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoryDiscountRequestModel } from '../models/CategoryDiscountRequest.model';
import { Observable } from 'rxjs';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = 'http://localhost:8080/api/discounts';

  constructor(private http: HttpClient,private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  create(discount: CategoryDiscountRequestModel): Observable<string> {
    return this.http.post(this.apiUrl, discount, {
      headers: this.getAuthHeaders(),
      responseType: 'text' as const
    });
  }

  update(id: number, discount: CategoryDiscountRequestModel): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}`, discount, {
      headers: this.getAuthHeaders(),
      responseType: 'text' as const
    });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
      responseType: 'text' as const
    });
  }

  getProductosConDescuento(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/products/with-discounts', {
      headers: this.getAuthHeaders()
    });
  }

  getConDescuentosOffline(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/products/with-discounts');
  }
}
