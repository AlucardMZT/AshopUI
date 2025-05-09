import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProductDiscountRequest } from '../models/ProductDiscountRequest.model';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductDiscountService {
  private apiUrl = `${environment.apiUrl}/product-discounts`;

  constructor(private http: HttpClient) {}

  create(discount: ProductDiscountRequest): Observable<any> {
    return this.http.post(this.apiUrl, discount);
  }

  update(id: number, discount: ProductDiscountRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, discount);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
