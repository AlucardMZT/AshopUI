// admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset } from 'chart.js';
import { OrderService } from '../../../services/orderservice.service';
import { ProductService } from '../../../services/product.service';

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import {MatList, MatListItem} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';
import {MatCard} from '@angular/material/card';
import {BaseChartDirective} from 'ng2-charts';
import {CommonModule} from '@angular/common';

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  imports: [
    MatListItem,
    MatList,
    MatIcon,
    MatCard,
    CommonModule,
    BaseChartDirective
  ],
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  totalOrders = 0;
  totalProducts = 0;
  monthlyRevenue = 0;
  latestOrders: any[] = [];
  topProducts: { name: string; totalSold: number }[] = [];

  // Chart config
  barChartOptions: ChartOptions = {
    responsive: true
  };
  barChartLabels: string[] = [];
  barChartType: ChartType = 'bar';
  barChartLegend = true;
  barChartPlugins = [];
  barChartData: ChartDataset[] = [
    { data: [], label: 'Ingresos mensuales ($)' }
  ];

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    this.orderService.getMyOrders().subscribe(orders => {
      this.totalOrders = orders.length;
      this.monthlyRevenue = orders.reduce((acc, o) => acc + o.total, 0);
      this.latestOrders = orders.slice(0, 5);

      // Agrupar ingresos por mes
      const monthly = new Map<string, number>();
      const productSales = new Map<string, number>();

      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthly.set(label, (monthly.get(label) || 0) + order.total);

        // Contar ventas por producto
        order.items.forEach(item => {
          const current = productSales.get(item.productName) || 0;
          productSales.set(item.productName, current + item.quantity);
        });
      });

      // Actualizar gráfico
      this.barChartLabels = Array.from(monthly.keys());
      this.barChartData[0].data = Array.from(monthly.values());

      // Top productos vendidos
      this.topProducts = Array.from(productSales.entries())
        .map(([name, totalSold]) => ({ name, totalSold }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);
    });

    this.productService.getAll().subscribe(products => {
      this.totalProducts = products.length;
    });
  }
}
