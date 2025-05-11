import {Component, OnInit} from '@angular/core';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {CartService} from '../../../services/car.service';
import {CartItem} from '../../../models/caritem.model';
import {MatIcon} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {Router} from '@angular/router';
import {OrderService} from '../../../services/orderservice.service';
import {AuthService} from '../../../services/auth.service';
import {User} from '../../../models/user.model';
import {MatFormField, MatLabel} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

export interface SavedCart {
  id: number;
  name: string;
  itemsJson: string;
  createdAt: string;
}

@Component({
  selector: 'app-car',
  imports: [CommonModule, MatCardModule, MatButtonModule, NgForOf, NgIf, MatIcon, MatFormField, MatSelect, MatOption,MatLabel],
  templateUrl: './car.component.html',
  styleUrl: './car.component.scss'
})
export class CarComponent implements OnInit{
  cart: CartItem[] = [];
  section = 'carrito';
  savedCarts: SavedCart[] = [];
  user: User | null = null;

  selectedAddress: string = '';

  constructor(private orderService: OrderService, private cartService: CartService, private router: Router, private profiles: AuthService) {}

  ngOnInit(): void {
    this.cart = this.cartService.getCart();
    this.profiles.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.selectedAddress = data.address;
      },
      error: (err) => console.error('Error cargando usuario', err)
    });

  }

  getTotal(): number {
    return this.cart.reduce((acc, item) => {
      const price = item.product.finalPrice ?? item.product.originalPrice ?? item.product.price ?? 0;
      return acc + price * item.quantity;
    }, 0);
  }

  guardarCompra() {
    const nombre = prompt('Nombre para guardar el carrito');
    if (!nombre?.trim()) return;

    this.cartService.guardarCarrito(nombre.trim(), this.cart).subscribe({
      next: () => alert('Carrito guardado en servidor'),
      error: err => alert('Error al guardar carrito: ' + err.message)
    });
  }

  cargarCarrito(cart: SavedCart) {
    try {
      const parsedItems = typeof cart.itemsJson === 'string'
        ? JSON.parse(cart.itemsJson)
        : cart.itemsJson;

      this.cart = parsedItems;
      this.section = 'carrito';
      this.cartService.saveToLocal();
    } catch (err) {
      alert('Error cargando carrito guardado');
    }
  }

  abrirCarritosGuardados() {
    this.section = 'guardados';

    this.cartService.obtenerCarritosGuardados().subscribe({
      next: (carts) => this.savedCarts = carts,
      error: err => console.error('Error cargando carritos:', err)
    });
  }

  eliminarCarrito(id: number) {
    this.cartService.eliminarCarrito(id).subscribe({
      next: () => {
        this.savedCarts = this.savedCarts.filter(c => c.id !== id);
      },
      error: err => alert('Error al eliminar: ' + err.message)
    });
  }

  increaseQuantity(item: CartItem) {
    item.quantity += 1;
    this.cartService.saveToLocal();
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.removeFromCart(item.product.id);
      return;
    }
    this.cartService.saveToLocal();
  }

  saveToLocal() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  removeFromCart(productId: string | number) {
    this.cartService.removeFromCart(productId);
    this.cart = this.cartService.getCart();
  }

  procederAlPago(): void {
    if (this.cart.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    if (!this.user) {
      alert('No se pudo obtener la información del usuario.');
      return;
    }

    const items = this.cart
      .filter(item => item.product && item.product.id != null)
      .map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.hasDiscount && item.product.finalPrice != null
          ? item.product.finalPrice
          : item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        size: item.product.size || '',
        hasDiscount: item.product.hasDiscount ?? false,
        finalPrice: item.product.finalPrice ?? null
      }));

    if (items.length === 0) {
      alert('No hay productos válidos en el carrito.');
      return;
    }

    const pedido = {
      items,
      nombre: this.user.name,
      telefono: this.user.phone,
      direccion: this.selectedAddress,
      municipality: this.user.municipality,
      state: this.user.state,
      countryName: this.user.countryName,
      total: this.getTotal()
    };

    this.orderService.crearOrden(pedido).subscribe({
      next: (response) => {
        const orderId = response.orderId;
        this.cartService.clearCart();
        this.router.navigate(['/pago', orderId])
          .then(success => {
            if (success) {
              console.log('🧭 Redirigido a pago del pedido:', orderId);
            } else {
              console.warn('⚠️ Navegación a pago fallida');
            }
          })
          .catch(err => {
            console.error('❌ Error redirigiendo al pago:', err);
          });
      },
      error: (err) => {
        const errorMsg = err?.error || 'No se pudo procesar el pedido';
        alert(errorMsg);
        console.error('❌ Error al crear la orden:', err);
      }
    });
  }




}
