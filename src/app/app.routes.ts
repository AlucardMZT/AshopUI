import {Routes} from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {LoginComponent} from './auth/login/login.component';
import {RegisterComponent} from './auth/register/register.component';
import {AuthGuard} from './auth/auth.guard';
import {ProfileComponent} from './pages/profile/profile.component';
import {AccountComponent} from './pages/profile/account/account.component';
import {OrdersComponent} from './pages/profile/orders/orders.component';
import {HistoryComponent} from './pages/profile/history/history.component';
import {SettingsComponent} from './pages/profile/settings/settings.component';
import {CarComponent} from './pages/profile/car/car.component';
import {ConfirmacionpedidoComponent} from './pages/profile/orders/confirmacionpedido/confirmacionpedido.component';
import {VerPedidoComponent} from './pages/profile/orders/verpedido/verpedido.component';
import {AdminProductFormComponent} from './admin-product-form/admin-product-form.component';

export const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { role: 'USER' }
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: '',
    component: ProfileComponent,
    data: { role: 'USER' },
    children: [
      {path: '', redirectTo: 'account', pathMatch: 'full'},
      {path: 'account', component: AccountComponent},
      {path: 'orders', component: OrdersComponent},
      {path: 'history', component: HistoryComponent},
      {path: 'settings', component: SettingsComponent},
      {path: 'car', component: CarComponent},
      {path: 'confirmacion-pedido', component: ConfirmacionpedidoComponent},
      {path: 'ver-pedido', component: VerPedidoComponent}
    ]
  },
  {
    path: 'productos/:id',
    loadComponent: () =>
      import('./pages/product-list/product-detail/product-detail.component')
        .then(m => m.ProductDetailComponent)
  },
  {
    path: 'a-shop-ctrl-984-panel',
    component: AdminProductFormComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMIN' }
  },
  {path: '**', redirectTo: '', pathMatch: 'full'}
];
