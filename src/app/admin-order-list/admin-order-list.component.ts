import {Component, OnInit} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatAnchor, MatButton} from '@angular/material/button';
import {ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable
} from '@angular/material/table';
import {NgClass, NgIf} from '@angular/common';
import {AdminOrderService} from '../services/adminorder.service';
import {MatFormField, MatLabel} from '@angular/material/input';

import {Order} from '../models/orderitem.model';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-admin-order-list',
  imports: [
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatTable,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    NgIf,
    MatButton,
    NgClass

  ],
  templateUrl: './admin-order-list.component.html',
  styleUrl: './admin-order-list.component.scss'
})
export class AdminOrderListComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  columns = ['id', 'orderNumber', 'nombre', 'telefono', 'direccion', 'total', 'status', 'actions'];


  selectedStatus: string = 'ALL';

  constructor(private orderService: AdminOrderService) {}

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe({
      next: data => {
        this.orders = data;
        this.filtrar();
      },
      error: err => console.error('Error al cargar pedidos', err)
    });
  }

  filtrar() {
    if (this.selectedStatus === 'ALL') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.selectedStatus);
    }
  }


  marcarComoPagado(orderId: number) {
    if (confirm('¿Confirmas marcar este pedido como PAGADO?')) {
      this.orderService.updateOrderStatus(orderId, 'PAID').subscribe({
        next: msg => {
          alert(msg);
          const pedido = this.orders.find(o => o.id === orderId);
          if (pedido) pedido.status = 'PAID';
          this.filtrar();
        },
        error: err => {
          console.error(err);
          alert('Error al actualizar el estado');
        }
      });
    }
  }
}
