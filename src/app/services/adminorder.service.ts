import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private baseUrl = 'http://localhost:8080/api/dashboard-a-shop-ctrl-984/orders';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAllOrders(): Observable<any[]> {
    const token = this.auth.getToken();
    return this.http.get<any[]>(this.baseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  updateOrderStatus(id: number, status: string): Observable<string> {
    const token = this.auth.getToken();
    return this.http.put(`${this.baseUrl}/${id}/status`, { status }, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'text'
    });
  }
}
