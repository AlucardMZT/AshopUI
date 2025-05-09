import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoryDiscountRequestModel } from '../models/CategoryDiscountRequest.model';
import { Observable } from 'rxjs';
import {AuthService} from './auth.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private baseUrl = `${environment.apiUrl}/discounts`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl, { headers: this.getAuthHeaders() });
  }

  create(discount: CategoryDiscountRequestModel): Observable<string> {
    return this.http.post(this.baseUrl, discount, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  update(id: number, discount: CategoryDiscountRequestModel): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}`, discount, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  getProductosConDescuento(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/products/with-discounts`, {
      headers: this.getAuthHeaders()
    });
  }

  getConDescuentosOffline(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/products/with-discounts`);
  }
}
