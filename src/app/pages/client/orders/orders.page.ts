import { Component, OnInit, OnDestroy } from '@angular/core';
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
  private invalidateInterval: any = null;

  constructor(
    private router: Router,
    private cartService: CartService
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
    if (this.invalidateInterval) {
      clearInterval(this.invalidateInterval);
      this.invalidateInterval = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.clientMarker = null;
    this.deliveryMarker = null;
    this.routeLine = null;
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

  trackOrder(order: Order): void {
    this.stopFirestoreListener();
    this.trackedOrder = order;

    setTimeout(() => {
      this.initMap(order);

      // Escuchar Firestore en tiempo real para ubicación del repartidor
      this.firestoreSub = this.cartService.listenToOrder(order.id, (data) => {
        if (this.trackedOrder && data.deliveryLat && data.deliveryLng) {
          this.trackedOrder = { ...this.trackedOrder, ...data };
          this.updateMap(this.trackedOrder);
        }
      });
    }, 300);
  }

  closeTracking(): void {
    this.stopFirestoreListener();
    this.trackedOrder = null;
    this.destroyMap();
  }

  initMap(order: Order): void {
    this.destroyMap();

    const lat = order.lat || 9.9281;
    const lng = order.lng || -84.0907;

    const el = document.getElementById('client-map');
    if (!el) return;

    el.style.height = '280px';
    el.style.width = '100%';
    el.innerHTML = '';

    this.map = L.map(el, {
      zoomControl: true,
      preferCanvas: false,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
    }).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 8,
    }).addTo(this.map);

    // Fix mapa negro — invalidar tamaño continuamente al inicio
    this.invalidateInterval = setInterval(() => this.map?.invalidateSize(true), 200);
    setTimeout(() => {
      clearInterval(this.invalidateInterval);
      this.invalidateInterval = null;
    }, 6000);

    // Fix zoom negro
    this.map.on('zoomstart', () => {
      el.style.opacity = '0.99';
      this.map?.invalidateSize(true);
    });
    this.map.on('zoom', () => this.map?.invalidateSize(true));
    this.map.on('zoomend', () => {
      el.style.opacity = '1';
      [0, 50, 100, 200, 400, 800].forEach(t =>
        setTimeout(() => {
          this.map?.invalidateSize(true);
          this.map?.eachLayer((layer: any) => {
            if (layer._tiles) {
              Object.values(layer._tiles).forEach((tile: any) => {
                if (tile.el) tile.el.style.opacity = '1';
              });
            }
          });
        }, t)
      );
    });
    this.map.on('moveend', () => this.map?.invalidateSize(true));

    const clientIcon = L.divIcon({
      html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🏠</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (order.lat && order.lng) {
      this.clientMarker = L.marker([order.lat, order.lng], { icon: clientIcon })
        .addTo(this.map)
        .bindPopup(`<b>📍 Tu dirección</b><br>${order.address}`)
        .openPopup();
    }

    this.updateMap(order);
  }

  updateMap(order: Order): void {
    if (!this.map) return;

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
        ).addTo(this.map).bindPopup('🛵 Repartidor en camino');
      } else {
        this.deliveryMarker.setLatLng([order.deliveryLat, order.deliveryLng]);
      }

      if (this.routeLine) this.map.removeLayer(this.routeLine);
      if (order.lat && order.lng) {
        this.routeLine = L.polyline(
          [[order.deliveryLat, order.deliveryLng], [order.lat, order.lng]],
          { color: '#ffc107', weight: 3, dashArray: '6,6' }
        ).addTo(this.map);

        this.map.fitBounds(
          [[order.deliveryLat, order.deliveryLng], [order.lat, order.lng]],
          { padding: [40, 40] }
        );
      }

      this.map.invalidateSize(true);
    }
  }

  calcEta(order: Order): string {
    if (!order.deliveryLat || !order.deliveryLng || !order.lat || !order.lng) {
      return 'Esperando repartidor...';
    }
    const R = 6371;
    const dLat = (order.lat - order.deliveryLat) * Math.PI / 180;
    const dLng = (order.lng - order.deliveryLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(order.deliveryLat * Math.PI / 180) *
      Math.cos(order.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const etaMin = Math.ceil((dist / 30) * 60);
    return `~${etaMin} min · ${dist.toFixed(1)} km`;
  }

  goBack(): void {
    this.router.navigate(['/client/home']);
  }
}