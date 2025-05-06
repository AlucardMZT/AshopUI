import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthService} from './auth.service';
import {OrderItem, PlaceOrderRequest, Order} from '../models/orderitem.model';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private API_URL = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient, private authService: AuthService) {}

  crearOrden(payload: PlaceOrderRequest): Observable<{ orderId: number; orderNumber: string }> {
    const token = this.authService.getToken();

    return this.http.post<{ orderId: number; orderNumber: string }>(
      `${this.API_URL}/create`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'json'
      }
    );
  }

  getOrderByNumber(orderNumber: string): Observable<Order> {
    const token = this.authService.getToken();
    return this.http.get<Order>(`${this.API_URL}/numero/${orderNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getMyOrders(status?: string): Observable<Order[]> {
    const token = this.authService.getToken();
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Order[]>(`${this.API_URL}/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
  }

}
