import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';
import * as L from 'leaflet';
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
  private map: L.Map | null = null;
  private clientMarker: L.Marker | null = null;
  private deliveryMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private cdr: ChangeDetectorRef   // ← NUEVO
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(data => {
      this.orders = [...data.pending, ...data.cooking, ...data.sent];
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    this.stopFirestoreListener();
    this.destroyMap();
  }

  private stopFirestoreListener(): void {
    if (this.firestoreSub) {
      this.firestoreSub();
      this.firestoreSub = null;
    }
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.clientMarker = null;
    this.deliveryMarker = null;
    this.routeLine = null;
  }

  trackOrder(order: Order): void {
    this.stopFirestoreListener();
    this.destroyMap();
    this.trackedOrder = order;

    // Forzar render del div antes de inicializar Leaflet
    this.cdr.detectChanges();

    // Esperar dimensiones reales con ResizeObserver
    const el = document.getElementById('client-map');
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        observer.disconnect();
        this.initMap(order);
      }
    });
    observer.observe(el);

    // Fallback por si ResizeObserver no dispara
    setTimeout(() => {
      observer.disconnect();
      if (!this.map) this.initMap(order);
    }, 800);

    // Escuchar Firestore en tiempo real para ubicación del repartidor
    this.firestoreSub = this.cartService.listenToOrder(order.id, (data) => {
      if (this.trackedOrder && data.deliveryLat && data.deliveryLng) {
        this.trackedOrder = { ...this.trackedOrder, ...data };
        this.updateMap(this.trackedOrder);
      }
    });
  }

  closeTracking(): void {
    this.stopFirestoreListener();
    this.trackedOrder = null;
    this.destroyMap();
  }

  initMap(order: Order): void {
    this.destroyMap();

    const el = document.getElementById('client-map');
    if (!el) return;

    el.innerHTML = '';
    el.style.height = '280px';
    el.style.width = '100%';
    el.style.display = 'block';

    const lat = order.lat || 9.9281;
    const lng = order.lng || -84.0907;

    this.map = L.map(el, {
      zoomControl: true,
      preferCanvas: false,
    }).setView([lat, lng], 14);

    const map = this.map;   // ← declarar inmediatamente

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      keepBuffer: 4,
    }).addTo(map);

    // Dos invalidateSize + setView para forzar carga de tiles completa
    setTimeout(() => {
      map.invalidateSize(true);
      map.setView(map.getCenter(), map.getZoom(), { animate: false });
    }, 150);

    setTimeout(() => {
      map.invalidateSize(true);
      map.setView(map.getCenter(), map.getZoom(), { animate: false });
    }, 500);

    const clientIcon = L.divIcon({
      html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🏠</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (order.lat && order.lng) {
      this.clientMarker = L.marker([order.lat, order.lng], { icon: clientIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Tu dirección</b><br>${order.address}`)
        .openPopup();
    }

    this.updateMap(order);
  }

  updateMap(order: Order): void {
    if (!this.map) return;
    const map = this.map;

    const deliveryIcon = L.divIcon({
      html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🛵</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (order.deliveryLat && order.deliveryLng) {
      if (!this.deliveryMarker) {
        this.deliveryMarker = L.marker(
          [order.deliveryLat, order.deliveryLng],
          { icon: deliveryIcon }
        ).addTo(map).bindPopup('🛵 Repartidor en camino');
      } else {
        this.deliveryMarker.setLatLng([order.deliveryLat, order.deliveryLng]);
      }

      if (this.routeLine) map.removeLayer(this.routeLine);
      if (order.lat && order.lng) {
        this.routeLine = L.polyline(
          [[order.deliveryLat, order.deliveryLng], [order.lat, order.lng]],
          { color: '#ffc107', weight: 3, dashArray: '6,6' }
        ).addTo(map);

        map.fitBounds(
          [[order.deliveryLat, order.deliveryLng], [order.lat, order.lng]],
          { padding: [40, 40] }
        );
      }
    }
  }

  calcEta(order: Order): string {
    if (!order.deliveryLat || !order.deliveryLng || !order.lat || !order.lng) {
      return 'Esperando repartidor...';
    }
    const R = 6371;
    const dLat = (order.lat - order.deliveryLat) * Math.PI / 180;
    const dLng = (order.lng - order.deliveryLng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(order.deliveryLat * Math.PI / 180) *
      Math.cos(order.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const etaMin = Math.ceil((dist / 30) * 60);
    return `~${etaMin} min · ${dist.toFixed(1)} km`;
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

  goBack(): void {
    this.router.navigate(['/client/home']);
  }
}