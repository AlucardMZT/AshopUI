import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderItem } from '../../../../models/orderitem.model';
import { OrderService } from '../../../../services/orderservice.service';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';

export interface Order {
  id?: number;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
  nombre?: string;
  telefono?: string;
  direccion?: string;
}

@Component({
  selector: 'app-confirmacionpedido',
  standalone: true,
  imports: [CommonModule, MatButton, RouterLink],
  templateUrl: './confirmacionpedido.component.html',
  styleUrl: './confirmacionpedido.component.scss'
})
export class ConfirmacionpedidoComponent implements OnInit {
  orderNumber: string = '';
  order?: Order;
  loading: boolean = true;
  errorMessage: string = '';

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.orderNumber = params['numero'];
      if (this.orderNumber) {
        this.orderService.getOrderByNumber(this.orderNumber).subscribe({
          next: (data) => {
            this.order = { ...data, items: data.items ?? [] };
            this.loading = false;
          },
          error: (err) => {
            this.errorMessage = 'No se pudo cargar el pedido.';
            console.error('Error cargando pedido:', err);
            this.loading = false;
          }
        });
      } else {
        this.errorMessage = 'No se especificó un número de pedido.';
        this.loading = false;
      }
    });
  }
}
