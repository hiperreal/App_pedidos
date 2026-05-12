import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MENU_ITEMS } from '../../../core/models/menu.model';
import { CartService } from '../../../core/services/cart';

@Component({
  selector: 'app-detail',
  standalone: false,
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {
  item: MenuItem | undefined;
  extraQty: number[] = [];
  selectedVariant: string = '';
  notes: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.item = MENU_ITEMS.find(i => i.id === id);
    if (this.item) {
      this.extraQty = this.item.extras.map(() => 0);
      this.selectedVariant = this.item.variants.options[0];
    }
  }

  get currentPrice(): number {
    if (!this.item) return 0;
    return this.item.basePrice +
      this.item.extras.reduce(
        (sum, e, i) => sum + e.price * (this.extraQty[i] || 0), 0
      );
  }

  changeExtra(i: number, delta: number): void {
    this.extraQty[i] = Math.max(0, (this.extraQty[i] || 0) + delta);
  }

  selectVariant(v: string): void {
    this.selectedVariant = v;
  }

  addToCart(): void {
    if (!this.item) return;
    const extrasAdded = this.item.extras
      .map((e, i) => ({ name: e.name, qty: this.extraQty[i], price: e.price }))
      .filter(e => e.qty > 0);

    this.cartService.addItem({
      uid: Date.now(),
      itemId: this.item.id,
      name: this.item.name,
      emoji: this.item.emoji,
      imageUrl: this.item.imageUrl,
      variant: this.selectedVariant,
      extras: extrasAdded,
      notes: this.notes,
      price: this.currentPrice,
    });
    this.router.navigate(['/client/cart']);
  }

  goBack(): void {
    this.router.navigate(['/client/home']);
  }
}