import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { CartItem } from '../models/caritem.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private API_URL = `${environment.apiUrl}/cart`;
  private cart: any[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>(this.cart);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    const saved = localStorage.getItem('cart');
    this.cart = saved ? JSON.parse(saved) : [];
  }

  guardarCarrito(name: string, items: any[]): Observable<string> {
    const token = this.authService.getToken();
    return this.http.post(`${this.API_URL}/save`, { name, items }, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  obtenerCarritosGuardados(): Observable<any[]> {
    const token = this.authService.getToken();
    return this.http.get<any[]>(`${this.API_URL}/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  eliminarCarrito(id: number): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }

  addToCart(product: any): boolean {
    const index = this.cart.findIndex(p => p.product.id === product.id);

    if (index !== -1) {
      this.cart[index].quantity += 1;
    } else {
      this.cart.push({ product, quantity: 1 });
    }

    this.saveToLocal();
    this.cartSubject.next(this.cart);
    return index === -1;
  }

  getCart(): any[] {
    return this.cart;
  }

  removeFromCart(productId: string | number) {
    this.cart = this.cart.filter(p => p.product.id !== productId);
    this.saveToLocal();
    this.cartSubject.next(this.cart);
  }

  clearCart() {
    this.cart = [];
    localStorage.removeItem('cart');
    this.cartSubject.next(this.cart);
  }

  saveToLocal() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.cartSubject.next(this.cart);
  }

  procesarPago(cartItems: CartItem[]): Observable<string> {
    const token = this.authService.getToken();
    return this.http.post(`${this.API_URL}/create`, cartItems, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
  }
}
