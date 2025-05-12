import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';
import { CommonModule, NgIf } from '@angular/common';
import { PaymentService } from '../../../../services/payment.service';
import { Order } from '../../../../models/orderitem.model';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {PaymentSuccessDialogComponent} from './payment-success-dialog.component';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  standalone: true,
  imports: [
    NgIf,
    CommonModule,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatList,
    MatListItem,
    MatButton,
    MatIcon,
    MatProgressSpinner
  ]
})
export class PaymentComponent implements OnInit {
  orderId!: string;
  order: Order | null = null;
  isLoading = true;
  stripePromise = loadStripe('pk_test_51RLU2OPT97lRLDs5DMy1Aj7CV9FwSCeWIyuuXxDC2cUOM9NnXAQRV5BUPsWJymHF8j12lGGDalGcINKg4WO6FT7200lLJQNz55');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    if (!this.orderId) {
      this.router.navigate(['/']);
      return;
    }


    this.paymentService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;

        setTimeout(() => {
          (window as any).paypal?.Buttons({
            createOrder: (_: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{ amount: { value: order.total.toFixed(2) } }]
              });
            },
            onApprove: (_: any, actions: any) => {
              return actions.order.capture().then((details: any) => {
                const token = localStorage.getItem('auth_token') || '';
                this.paymentService.markOrderAsPaid(this.orderId, token).subscribe({
                  next: () => {
                    this.dialog.open(PaymentSuccessDialogComponent, {
                      data: { message: `Pago confirmado para ${details.payer.name.given_name}` }
                    });
                    this.router.navigate(['/orders']);
                  },
                  error: err => {
                    console.error('❌ Error al marcar como pagado', err);
                  }
                });
              });
            },
            onError: (err: any) => {
              console.error('❌ Error PayPal:', err);
            }
          }).render('#paypal-button-container');
        }, 500);
      },
      error: err => {
        this.isLoading = false;
        console.error('❌ Error cargando pedido:', err);
      }
    });

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
            this.dialog.open(PaymentSuccessDialogComponent, {
              data: { message: '✅ Pago realizado con Stripe correctamente.' }
            });
            this.router.navigate(['/orders']);
          } else if (error) {
            console.error('❌ Stripe error:', error.message);
          }
        });
      },
      error: err => {
        console.error('❌ Error creando PaymentIntent:', err);
      }
    });
  }
}
