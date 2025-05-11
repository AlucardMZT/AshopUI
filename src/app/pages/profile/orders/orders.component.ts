import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  MatTable,
  MatCell,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatRow,
  MatHeaderRowDef,
  MatRowDef,
  MatHeaderCellDef,
  MatCellDef, MatTableDataSource
} from '@angular/material/table';
import { NgIf, NgForOf } from '@angular/common';
import { OrderItem } from '../../../models/orderitem.model';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {MatPaginator} from '@angular/material/paginator';
import {MatCard, MatCardTitle} from '@angular/material/card';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {OrderService} from '../../../services/orderservice.service';
import {CountryService} from '../../../services/country.service';

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    NgIf,
    CommonModule,
    MatButton,
    MatLabel,
    MatFormField,
    MatSelect,
    MatOption,
    MatHeaderCell,
    MatColumnDef,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatTable,
    MatPaginator,
    MatCard,
    MatIcon,
    MatInput,
    FormsModule,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit, AfterViewInit {
  orders: Order[] = [];
  dataSource = new MatTableDataSource<Order>();
  filtroEstado: string = '';
  displayedColumns: string[] = ['orderNumber', 'status', 'createdAt', 'total', 'acciones'];
  searchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient,private router: Router,  private dialog: MatDialog,
              private snackBar: MatSnackBar,private orderService: OrderService,private countryService: CountryService) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders() {
    const token = localStorage.getItem('auth_token');
    this.http.get<Order[]>('http://localhost:8080/api/orders/mine', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe({
      next: data => {
        this.orders = data.map(order => ({
          ...order,
          createdAt: new Date(order.createdAt)
        }));
        this.filtrarPedidos();
      },
      error: err => console.error('Error al cargar pedidos:', err)
    });
  }

  filtrarPedidos() {
    const term = this.searchTerm.trim().toLowerCase();

    this.dataSource.data = this.orders.filter(order => {
      const matchesEstado = this.filtroEstado ? order.status === this.filtroEstado : true;
      const matchesSearch = term ? order.orderNumber.toLowerCase().includes(term) : true;
      return matchesEstado && matchesSearch;
    });
  }

  irAPagar(id: number) {
    this.router.navigate(['/pago', id])
      .then(success => {
        if (success) {
          console.log('✅ Navegación exitosa');
        } else {
          console.warn('⚠️ Falló la navegación');
        }
      })
      .catch(err => {
        console.error('❌ Error al navegar:', err);
      });
  }

  marcarComoPagado(id: number) {
    const token = localStorage.getItem('auth_token');
    this.http.put(`http://localhost:8080/api/orders/${id}/pay`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'text'
    }).subscribe({
      next: () => {
        alert('Pedido actualizado a PAGADO');
        this.fetchOrders();
      },
      error: err => alert('Error al actualizar: ' + err.message)
    });
  }

  eliminarPedido(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.orderService.eliminarPedido(id).subscribe({
          next: () => {
            this.snackBar.open('✅ Pedido eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.fetchOrders(); // refresca la lista
          },
          error: err => {
            this.snackBar.open('❌ Error al eliminar: ' + err.message, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  verPedido(orderNumber: any) {
    this.router.navigate(['/ver-pedido'], { queryParams: { numero: orderNumber } });
  }


}
