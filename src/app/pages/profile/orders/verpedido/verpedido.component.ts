import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {OrderService} from '../../../../services/orderservice.service';
import {MatButton} from '@angular/material/button';
import {CommonModule, NgIf} from '@angular/common';
import {Order} from '../../../../models/orderitem.model';

@Component({
  selector: 'app-verpedido',
  imports: [
    MatButton,
    CommonModule,
    NgIf,
    RouterLink
  ],
  templateUrl: './verpedido.component.html',
  styleUrl: './verpedido.component.scss'
})

export class VerPedidoComponent implements OnInit {
  order?: Order;
  errorMessage = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const numero = params['numero'];
      if (numero) {
        this.orderService.getOrderByNumber(numero).subscribe({
          next: data => {
            this.order = data;
            this.loading = false;
          },
          error: err => {
            this.errorMessage = 'No se pudo cargar el pedido.';
            this.loading = false;
          }
        });
      }
    });
  }

  volverAComprar() {
    if (!this.order) return;
    const cartItems = this.order.items.map(i => ({
      product: {
        id: 0, // ⚠️ Si no guardas `productId` en OrderItem, debes ajustar
        name: i.productName,
        price: i.unitPrice,
        image: i.image ?? '', // opcional si no tienes
        description: '',
        category: { id: 0, name: '' }
      },
      quantity: i.quantity
    }));

    localStorage.setItem('cart', JSON.stringify(cartItems)); // o usa `cartService`
    alert('Productos añadidos nuevamente al carrito.');
  }
}

