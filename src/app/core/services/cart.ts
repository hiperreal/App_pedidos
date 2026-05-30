import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Order } from '../models/menu.model';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly DELIVERY_FEE = 1.50;
  private db = getFirestore();

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  private ordersSubject = new BehaviorSubject<{
    pending: Order[]; cooking: Order[]; sent: Order[];
  }>({ pending: [], cooking: [], sent: [] });
  orders$ = this.ordersSubject.asObservable();

  constructor() {
    this.listenFirestore();
  }

  private listenFirestore(): void {
    const q = query(
      collection(this.db, 'orders'),
      orderBy('createdAt', 'asc')
    );

    onSnapshot(q, (snapshot) => {
      const pending: Order[] = [];
      const cooking: Order[] = [];
      const sent: Order[]    = [];

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const order: Order = {
          id:          d['id'],
          firestoreId: docSnap.id,
          num:         d['num'],
          items:       d['items'],
          notes:       d['notes'] ?? '',
          payMethod:   d['payMethod'],
          total:       d['total'],
          time:        d['time'],
          address:     d['address'] ?? '',
          lat:         d['lat'] ?? 0,
          lng:         d['lng'] ?? 0,
          deliveryLat: d['deliveryLat'] ?? undefined,
          deliveryLng: d['deliveryLng'] ?? undefined,
          status:      d['status'],
        };

        if (d['status'] === 'pending') pending.push(order);
        if (d['status'] === 'cooking') cooking.push(order);
        if (d['status'] === 'sent')    sent.push(order);
      });

      this.ordersSubject.next({ pending, cooking, sent });
    }, (err) => console.error('Error escuchando Firestore:', err));
  }

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

  async placeOrder(
    payMethod: string,
    address: string = '',
    lat: number = 0,
    lng: number = 0
  ): Promise<string> {
    if (!this.cartItems.length) return '';

    const id = Date.now();

    const allOrders = this.ordersSubject.value;
    const totalCount = allOrders.pending.length + allOrders.cooking.length + allOrders.sent.length;
    const num = `#${String(totalCount + 1).padStart(3, '0')}`;

    const items = this.cartItems.map(c => {
      let s = `${c.emoji} ${c.name} (${c.variant})`;
      if (c.extras.length) s += ` + ${c.extras.map(e => e.name).join(', ')}`;
      return s;
    });

    const notes = this.cartItems
      .filter(c => c.notes)
      .map(c => c.notes)
      .join('; ');

    await setDoc(doc(this.db, 'orders', String(id)), {
      id,
      num,
      items,
      notes,
      payMethod,
      total:       this.total,
      address,
      lat,
      lng,
      deliveryLat: null,
      deliveryLng: null,
      status:      'pending',
      time:        new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }),
      createdAt:   Timestamp.now(),
    });

    this.clearCart();
    return num;
  }

  async advanceOrder(id: number, from: 'pending' | 'cooking'): Promise<void> {
    const next = { pending: 'cooking', cooking: 'sent' };
    await updateDoc(doc(this.db, 'orders', String(id)), {
      status: next[from]
    });
  }

  async removeOrder(id: number, col: 'pending' | 'cooking' | 'sent'): Promise<void> {
    await deleteDoc(doc(this.db, 'orders', String(id)));
  }

  async updateDeliveryLocation(id: number, lat: number, lng: number): Promise<void> {
    await updateDoc(doc(this.db, 'orders', String(id)), {
      deliveryLat: lat,
      deliveryLng: lng,
    });
  }

  listenToOrder(id: number, callback: (data: Partial<Order>) => void): Unsubscribe {
    return onSnapshot(
      doc(this.db, 'orders', String(id)),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as Partial<Order>);
        }
      },
      (err) => console.error('Error escuchando orden:', err)
    );
  }
}