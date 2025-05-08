import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {OrderService} from '../../../../services/orderservice.service';
import {MatButton} from '@angular/material/button';
import {CommonModule, NgIf} from '@angular/common';
import {Order} from '../../../../models/orderitem.model';
import {CartItem} from '../../../../models/caritem.model';
import { Location } from '@angular/common';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-verpedido',
  imports: [
    MatButton,
    CommonModule,
    NgIf,
  ],
  templateUrl: './verpedido.component.html',
  styleUrl: './verpedido.component.scss'
})

export class VerPedidoComponent implements OnInit {
  order?: Order;
  errorMessage = '';
  loading = true;
  countries: any[] = [];
  selectedCountryName: string = 'Desconocido';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private location: Location,
    private http: HttpClient,
  ) {}


  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:8080/api/countries').subscribe({
      next: countries => {
        this.countries = countries;

        this.route.queryParams.subscribe(params => {
          const numero = params['numero'];
          if (numero) {
            this.orderService.getOrderByNumber(numero).subscribe({
              next: data => {
                this.order = data;

                const countryId = Number(data.user?.countryId);
                const match = this.countries.find(c => c.id === countryId);
                this.selectedCountryName = match?.name ?? 'Desconocido';

                this.loading = false;
              },
              error: err => {
                this.errorMessage = 'No se pudo cargar el pedido.';
                this.loading = false;
              }
            });
          }
        });
      },
      error: err => {
        console.error('❌ Error al cargar países', err);
        this.loading = false;
      }
    });
  }




  volverAComprar() {
    if (!this.order) return;

    const cartItems: CartItem[] = this.order.items.map(i => ({
      product: {
        id: i.productId,
        name: i.productName,
        price: i.unitPrice,
        image: i.image || '',
        image1: i.image || '',
        image2: i.image || '',
        description: '',
        size: i.size || '',
        stock: 0, // 👈 se agrega para cumplir con la interfaz Product
        category: { id: 0, name: '' }
      },
      quantity: i.quantity
    }));

    localStorage.setItem('cart', JSON.stringify(cartItems));
    alert('✅ Productos añadidos nuevamente al carrito.');
    this.router.navigate(['/car']).then(() => {
      window.location.reload();
    });
  }


}

