import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem, MENU_CATEGORIES, MENU_ITEMS } from '../../../core/models/menu.model';
import { CartService } from '../../../core/services/cart';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  categories: string[] = MENU_CATEGORIES;
  allItems: MenuItem[] = MENU_ITEMS;
  filteredItems: MenuItem[] = [];
  activeCat: string = 'Todos';
  sectionTitle: string = 'Lo más pedido';
  cartCount: number = 0;
  private sub!: Subscription;

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.filteredItems = [...this.allItems];
    this.sub = this.cartService.cart$.subscribe(
      (items) => { this.cartCount = items.length; }
    );
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  filterCat(cat: string): void {
    this.activeCat = cat;
    this.sectionTitle = cat === 'Todos' ? 'Lo más pedido' : cat;
    this.filteredItems = cat === 'Todos'
      ? [...this.allItems]
      : this.allItems.filter((i: MenuItem) => i.category === cat);
  }

  openDetail(item: MenuItem): void {
    this.router.navigate(['/client/detail', item.id]);
  }

  goToCart(): void {
    this.router.navigate(['/client/cart']);
  }

  goToKds(): void {
    this.router.navigate(['/restaurant/kds']);
  }

  goToOrders(): void {
    this.router.navigate(['/client/orders']);
  }
}