import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Order } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly DELIVERY_FEE = 1.50;
  private orderCounter = 0;

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  private ordersSubject = new BehaviorSubject<{
    pending: Order[]; cooking: Order[]; sent: Order[];
  }>({ pending: [], cooking: [], sent: [] });
  orders$ = this.ordersSubject.asObservable();
 getOrders() { return this.ordersSubject.value; }

  get cartItems(): CartItem[] { return this.cartSubject.value; }
  get cartCount(): number     { return this.cartItems.length; }
  get subtotal(): number      { return this.cartItems.reduce((s, i) => s + i.price, 0); }
  get deliveryFee(): number   { return this.DELIVERY_FEE; }
  get total(): number         { return this.subtotal + this.DELIVERY_FEE; }

  addItem(item: CartItem): void {
    this.cartSubject.next([...this.cartItems, item]);
  }

  removeItem(uid: number): void {
    this.cartSubject.next(this.cartItems.filter(i => i.uid !== uid));
  }

  clearCart(): void { this.cartSubject.next([]); }

  placeOrder(payMethod: string, address: string = '', lat: number = 0, lng: number = 0): string {
    if (!this.cartItems.length) return '';
    this.orderCounter++;
    const num = `#${String(this.orderCounter).padStart(3, '0')}`;
    const order: Order = {
      id: Date.now(), num,
      items: this.cartItems.map(c => {
        let s = `${c.emoji} ${c.name} (${c.variant})`;
        if (c.extras.length) s += ` + ${c.extras.map(e => e.name).join(', ')}`;
        return s;
      }),
      notes: this.cartItems.filter(c => c.notes).map(c => c.notes).join('; '),
      payMethod,
      total: this.total,
      time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
      address,
      lat,
      lng,
      deliveryLat: undefined,
      deliveryLng: undefined,
    };
    const cur = this.ordersSubject.value;
    this.ordersSubject.next({ ...cur, pending: [...cur.pending, order] });
    this.clearCart();
    return num;
  }

  advanceOrder(id: number, from: 'pending' | 'cooking'): void {
    const next = { pending: 'cooking', cooking: 'sent' } as const;
    const cur = { ...this.ordersSubject.value };
    const idx = cur[from].findIndex(o => o.id === id);
    if (idx < 0) return;
    const [order] = cur[from].splice(idx, 1);
    const nextKey = next[from] as 'cooking' | 'sent';
    cur[nextKey] = [...cur[nextKey], order];
    this.ordersSubject.next({ ...cur });
  }

  removeOrder(id: number, col: 'pending' | 'cooking' | 'sent'): void {
    const cur = { ...this.ordersSubject.value };
    cur[col] = cur[col].filter(o => o.id !== id);
    this.ordersSubject.next({ ...cur });
  }

  updateDeliveryLocation(id: number, lat: number, lng: number): void {
    const cur = { ...this.ordersSubject.value };
    const order = cur.sent.find(o => o.id === id);
    if (order) {
      order.deliveryLat = lat;
      order.deliveryLng = lng;
      this.ordersSubject.next({ ...cur });
    }
  }
}