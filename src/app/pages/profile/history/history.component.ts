import {Component, OnInit} from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {Order} from '../../../models/orderitem.model';
import {OrderService} from '../../../services/orderservice.service';
import {MatDivider} from '@angular/material/divider';
import {RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-history',
  imports: [
    NgIf,
    CommonModule,
    MatDivider,
    RouterLink,
    MatButton,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit{

  constructor(private orderService: OrderService) {
  }
  orders: Order[] = [];

  ngOnInit(): void {
    this.orderService.getMyOrders('PAGADO').subscribe({
      next: data => {
        this.orders = data;
      },
      error: err => {
        console.error('Error al cargar historial:', err);
      }
    });
  }
}
