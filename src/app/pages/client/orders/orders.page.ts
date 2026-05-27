import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';
import maplibregl from 'maplibre-gl';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
  orders: Order[] = [];
  trackedOrder: Order | null = null;
  private sub!: Subscription;
  private firestoreSub: Unsubscribe | null = null;
  private map: maplibregl.Map | null = null;
  private clientMarker: maplibregl.Marker | null = null;
  private deliveryMarker: maplibregl.Marker | null = null;

  constructor(private router: Router, private cartService: CartService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(data => {
      this.orders = [...data.pending, ...data.cooking, ...data.sent];
    });
  }

  ionViewDidLeave(): void { this.stopFirestoreListener(); this.destroyMap(); this.trackedOrder = null; }
  ngOnDestroy(): void { if (this.sub) this.sub.unsubscribe(); this.stopFirestoreListener(); this.destroyMap(); }

  private stopFirestoreListener(): void {
    if (this.firestoreSub) { this.firestoreSub(); this.firestoreSub = null; }
  }

  private destroyMap(): void {
    if (this.clientMarker) { this.clientMarker.remove(); this.clientMarker = null; }
    if (this.deliveryMarker) { this.deliveryMarker.remove(); this.deliveryMarker = null; }
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private waitForMapContainer(id: string, timeout = 2500): Promise<HTMLElement | null> {
    const start = performance.now();
    return new Promise(resolve => {
      const check = () => {
        const el = document.getElementById(id);
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) { resolve(el); return; }
        if (performance.now() - start > timeout) { resolve(el); return; }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  trackOrder(order: Order): void {
    this.stopFirestoreListener();
    this.destroyMap();
    this.trackedOrder = order;
    this.cdr.detectChanges();
    this.waitForMapContainer('client-map').then(el => {
      if (el && this.trackedOrder?.id === order.id) this.initMap(order, el);
    });
    this.firestoreSub = this.cartService.listenToOrder(order.id, (data) => {
      if (this.trackedOrder && data.deliveryLat && data.deliveryLng) {
        this.trackedOrder = { ...this.trackedOrder, ...data };
        this.updateMap(this.trackedOrder);
      }
    });
  }

  closeTracking(): void { this.stopFirestoreListener(); this.trackedOrder = null; this.destroyMap(); }

  initMap(order: Order, el: HTMLElement): void {
    this.destroyMap();
    el.innerHTML = '';
    el.style.height = '280px'; el.style.width = '100%';
    el.style.display = 'block'; el.style.position = 'relative'; el.style.zIndex = '0';

    const lat = order.lat || 9.9281;
    const lng = order.lng || -84.0907;

    this.map = new maplibregl.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [lng, lat],
      zoom: 14,
    });

    this.map.on('load', () => {
      if (order.lat && order.lng) {
        const el1 = document.createElement('div');
        el1.innerHTML = '🏠';
        el1.style.fontSize = '28px';
        this.clientMarker = new maplibregl.Marker({ element: el1 })
          .setLngLat([order.lng, order.lat])
          .setPopup(new maplibregl.Popup().setHTML(`<b>📍 Tu dirección</b><br>${order.address}`))
          .addTo(this.map!);
      }
      this.updateMap(order);
    });
  }

  updateMap(order: Order): void {
    if (!this.map) return;
    if (order.deliveryLat && order.deliveryLng) {
      if (!this.deliveryMarker) {
        const el2 = document.createElement('div');
        el2.innerHTML = '🛵';
        el2.style.fontSize = '28px';
        this.deliveryMarker = new maplibregl.Marker({ element: el2 })
          .setLngLat([order.deliveryLng, order.deliveryLat])
          .setPopup(new maplibregl.Popup().setHTML('🛵 Repartidor en camino'))
          .addTo(this.map);
      } else {
        this.deliveryMarker.setLngLat([order.deliveryLng, order.deliveryLat]);
      }

      if (order.lat && order.lng) {
        const bounds = new maplibregl.LngLatBounds(
          [order.deliveryLng, order.deliveryLat],
          [order.lng, order.lat]
        );
        this.map.fitBounds(bounds, { padding: 60 });
      }
    }
  }

  calcEta(order: Order): string {
    if (!order.deliveryLat || !order.deliveryLng || !order.lat || !order.lng) return 'Esperando repartidor...';
    const R = 6371;
    const dLat = (order.lat - order.deliveryLat) * Math.PI / 180;
    const dLng = (order.lng - order.deliveryLng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(order.deliveryLat*Math.PI/180)*Math.cos(order.lat*Math.PI/180)*Math.sin(dLng/2)**2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return `~${Math.ceil((dist/30)*60)} min · ${dist.toFixed(1)} km`;
  }

  getStatusLabel(order: Order): string {
    const all = this.cartService.getOrders();
    if (all.pending.find((o: Order) => o.id === order.id)) return '⏳ Pendiente';
    if (all.cooking.find((o: Order) => o.id === order.id)) return '👨‍🍳 En cocina';
    if (all.sent.find((o: Order) => o.id === order.id))    return '🛵 En camino';
    return '✅ Entregado';
  }

  getStatusColor(order: Order): string {
    const label = this.getStatusLabel(order);
    if (label.includes('Pendiente')) return '#FF6B00';
    if (label.includes('cocina'))    return '#FFC107';
    if (label.includes('camino'))    return '#2196F3';
    return '#4CAF50';
  }

  goBack(): void { this.router.navigate(['/client/home']); }
}