import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgIf } from '@angular/common';
import { Order } from '../../../../models/orderitem.model';
import {PaymentService} from '../../../../services/payment.service';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatList, MatListItem} from '@angular/material/list';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon'; // ✅ Asegúrate que el path es correcto

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  imports: [
    NgIf,
    CommonModule,
    MatCard,
    MatCardTitle,
    MatList,
    MatCardContent,
    MatListItem,
    MatButton,
    MatIcon
  ],
  standalone: true
})
export class PaymentComponent implements OnInit {
  orderId!: string;
  order: Order | null = null;
  stripePromise = loadStripe('pk_test_51RLU2OPT97lRLDs5DMy1Aj7CV9FwSCeWIyuuXxDC2cUOM9NnXAQRV5BUPsWJymHF8j12lGGDalGcINKg4WO6FT7200lLJQNz55');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';

    // Obtener datos del pedido
    this.paymentService.getOrder(this.orderId).subscribe({
      next: (order) => {
        console.log('✅ Pedido cargado:', order);
        this.order = order;

        // Inicializar PayPal
        setTimeout(() => {
          (window as any).paypal.Buttons({
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: order.total.toFixed(2)
                  }
                }]
              });
            },
            onApprove: (data: any, actions: any) => {
              return actions.order.capture().then((details: any) => {
                alert(`✅ Pago completado por ${details.payer.name.given_name}`);
                const token = localStorage.getItem('auth_token') || '';
                this.paymentService.markOrderAsPaid(this.orderId, token).subscribe({
                  next: () => this.router.navigate(['/orders']),
                  error: err => {
                    console.error('❌ Error actualizando pedido:', err);
                    alert('Pago exitoso, pero error al actualizar el pedido');
                  }
                });
              });
            },
            onError: (err: any) => {
              console.error('❌ Error PayPal:', err);
              alert('Error al procesar el pago con PayPal');
            }
          }).render('#paypal-button-container');
        }, 500);
      },
      error: err => console.error('❌ Error cargando pedido:', err)
    });

    // Inicializar Stripe
    this.paymentService.createPaymentIntent(this.orderId).subscribe({
      next: async (res) => {
        const stripe = await this.stripePromise;
        const elements = stripe!.elements();
        const card = elements.create('card');
        card.mount('#card-element');

        const form = document.getElementById('payment-form')!;
        form.addEventListener('submit', async (event) => {
          event.preventDefault();

          const { paymentIntent, error } = await stripe!.confirmCardPayment(res.clientSecret, {
            payment_method: { card }
          });

          if (paymentIntent?.status === 'succeeded') {
            alert('✅ Pago realizado con Stripe');
            this.router.navigate(['/orders']);
          } else if (error) {
            alert('❌ Error con Stripe: ' + error.message);
          }
        });
      },
      error: err => console.error('Error creando PaymentIntent:', err)
    });
  }
}
