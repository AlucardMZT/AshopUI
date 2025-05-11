import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthService} from './auth.service';
import {OrderItem, PlaceOrderRequest, Order} from '../models/orderitem.model';
import { HttpParams } from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  crearOrden(payload: PlaceOrderRequest): Observable<{ orderId: number; orderNumber: string }> {
    const token = this.authService.getToken();
    return this.http.post<{ orderId: number; orderNumber: string }>(
      `${this.baseUrl}/create`, payload,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  }

  getOrderByNumber(orderNumber: string): Observable<Order> {
    const token = this.authService.getToken();
    return this.http.get<Order>(`${this.baseUrl}/numero/${orderNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  getMyOrders(status?: string): Observable<Order[]> {
    const token = this.authService.getToken();
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http.get<Order[]>(`${this.baseUrl}/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
  }

  eliminarPedido(id: number): Observable<string> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }
}
