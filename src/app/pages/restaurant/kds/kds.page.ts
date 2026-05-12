import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';

@Component({
  selector: 'app-kds',
  standalone: false,
  templateUrl: './kds.page.html',
  styleUrls: ['./kds.page.scss'],
})
export class KdsPage {
  orders$: Observable<{ pending: Order[]; cooking: Order[]; sent: Order[] }>;

  constructor(private cartService: CartService) {
    this.orders$ = this.cartService.orders$;
  }

  advance(id: number, col: 'pending' | 'cooking'): void {
    this.cartService.advanceOrder(id, col);
  }

  remove(id: number, col: 'pending' | 'cooking' | 'sent'): void {
    this.cartService.removeOrder(id, col);
  }

  openMaps(order: Order): void {
    window.open('https://www.google.com/maps', '_blank');
  }
}