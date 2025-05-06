import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AuthService} from './auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = 'http://localhost:8080/api/payments';

  constructor(private http: HttpClient,private authService: AuthService) {}

  getOrder(id: string) {
    const token = this.authService.getToken();
    return this.http.get<any>(`${this.apiUrl}/order/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  createPaymentIntent(orderId: string) {
    const token = this.authService.getToken();
    return this.http.post<{ clientSecret: string }>(
      `${this.apiUrl}/create-payment-intent`,
      { orderId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  }

  markOrderAsPaid(orderId: string, token: string) {
    return this.http.put(`http://localhost:8080/api/orders/${orderId}/pay`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }
}
