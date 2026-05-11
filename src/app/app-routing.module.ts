import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login',
    loadChildren: () => import('./pages/auth/login/login.module')
      .then(m => m.LoginPageModule) },

  { path: 'register',
    loadChildren: () => import('./pages/auth/register/register.module')
      .then(m => m.RegisterPageModule) },

  { path: 'client/home',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'client' },
    loadChildren: () => import('./pages/client/home/home.module')
      .then(m => m.HomePageModule) },

  { path: 'client/detail/:id',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/client/detail/detail.module')
      .then(m => m.DetailPageModule) },

  { path: 'client/cart',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/client/cart/cart.module')
      .then(m => m.CartPageModule) },

  { path: 'client/orders',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/client/orders/orders.module')
      .then(m => m.OrdersPageModule) },

  { path: 'restaurant/kds',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'restaurant' },
    loadChildren: () => import('./pages/restaurant/kds/kds.module')
      .then(m => m.KdsPageModule) },

  { path: 'restaurant/dashboard',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'restaurant' },
    loadChildren: () => import('./pages/restaurant/dashboard/dashboard.module')
      .then(m => m.DashboardPageModule) },

  { path: 'restaurant/menu-manager',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'restaurant' },
    loadChildren: () => import('./pages/restaurant/menu-manager/menu-manager.module')
      .then(m => m.MenuManagerPageModule) },

  { path: 'delivery/my-deliveries',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'delivery' },
    loadChildren: () => import('./pages/delivery/my-deliveries/my-deliveries.module')
      .then(m => m.MyDeliveriesPageModule) },

  { path: 'admin/dashboard',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    loadChildren: () => import('./pages/admin/dashboard/dashboard.module')
      .then(m => m.DashboardPageModule) },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login',
    loadChildren: () => import('./pages/auth/login/login.module')
      .then(m => m.LoginPageModule) },

  { path: 'register',
    loadChildren: () => import('./pages/auth/register/register.module')
      .then(m => m.RegisterPageModule) },

  { path: 'client/home',
    loadChildren: () => import('./pages/client/home/home.module')
      .then(m => m.HomePageModule) },

  { path: 'client/detail/:id',
    loadChildren: () => import('./pages/client/detail/detail.module')
      .then(m => m.DetailPageModule) },

  { path: 'client/cart',
    loadChildren: () => import('./pages/client/cart/cart.module')
      .then(m => m.CartPageModule) },

  { path: 'client/orders',
    loadChildren: () => import('./pages/client/orders/orders.module')
      .then(m => m.OrdersPageModule) },

  { path: 'restaurant/kds',
    loadChildren: () => import('./pages/restaurant/kds/kds.module')
      .then(m => m.KdsPageModule) },

  { path: 'restaurant/dashboard',
    loadChildren: () => import('./pages/restaurant/dashboard/dashboard.module')
      .then(m => m.DashboardPageModule) },

  { path: 'restaurant/menu-manager',
    loadChildren: () => import('./pages/restaurant/menu-manager/menu-manager.module')
      .then(m => m.MenuManagerPageModule) },

  { path: 'delivery/my-deliveries',
    loadChildren: () => import('./pages/delivery/my-deliveries/my-deliveries.module')
      .then(m => m.MyDeliveriesPageModule) },

  { path: 'admin/dashboard',
    loadChildren: () => import('./pages/admin/dashboard/dashboard.module')
      .then(m => m.DashboardPageModule) },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}