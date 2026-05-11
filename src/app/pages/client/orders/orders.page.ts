import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
  pending: Order[] = [];
  cooking: Order[] = [];
  sent: Order[] = [];
  private sub!: Subscription;

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(orders => {
      this.pending = orders.pending;
      this.cooking = orders.cooking;
      this.sent     = orders.sent;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  get allOrders(): Order[] {
    return [...this.pending, ...this.cooking, ...this.sent];
  }

  getStatus(order: Order): string {
    if (this.sent.find(o => o.id === order.id))    return 'Entregado';
    if (this.cooking.find(o => o.id === order.id)) return 'En preparación';
    return 'Pendiente';
  }

  getStatusColor(order: Order): string {
    if (this.sent.find(o => o.id === order.id))    return '#4CAF50';
    if (this.cooking.find(o => o.id === order.id)) return '#FFC107';
    return '#FF6B00';
  }

  getStatusEmoji(order: Order): string {
    if (this.sent.find(o => o.id === order.id))    return '✅';
    if (this.cooking.find(o => o.id === order.id)) return '👨‍🍳';
    return '⏳';
  }

  goHome(): void {
    this.router.navigate(['/client/home']);
  }
}