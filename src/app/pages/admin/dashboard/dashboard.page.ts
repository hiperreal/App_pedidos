import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  totalOrders: number = 0;
  totalRevenue: number = 0;
  pendingOrders: number = 0;
  cookingOrders: number = 0;
  sentOrders: number = 0;
  allOrders: Order[] = [];
  private sub!: Subscription;
  topProducts: { name: string; count: number; emoji: string }[] = [];

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(data => {
      this.pendingOrders = data.pending.length;
      this.cookingOrders = data.cooking.length;
      this.sentOrders    = data.sent.length;
      this.allOrders     = [...data.pending, ...data.cooking, ...data.sent];
      this.totalOrders   = this.allOrders.length;
      this.totalRevenue  = this.allOrders.reduce((sum, o) => sum + o.total, 0);
      this.calcTopProducts();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  calcTopProducts(): void {
    const map = new Map<string, { count: number; emoji: string }>();
    this.allOrders.forEach(order => {
      order.items.forEach(item => {
        const match = item.match(/^(\S+)\s(.+?)\s\(/);
        if (match) {
          const emoji = match[1];
          const name  = match[2];
          const prev  = map.get(name) ?? { count: 0, emoji };
          map.set(name, { count: prev.count + 1, emoji });
        }
      });
    });
    this.topProducts = Array.from(map.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  goToKds(): void {
    this.router.navigate(['/restaurant/kds']);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}