import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';
import * as L from 'leaflet';

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
  private map: L.Map | null = null;
  private clientMarker: L.Marker | null = null;
  private deliveryMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(data => {
      this.orders = [...data.pending, ...data.cooking, ...data.sent];
      if (this.trackedOrder) {
        const updated = this.orders.find(o => o.id === this.trackedOrder!.id);
        if (updated) {
          this.trackedOrder = updated;
          this.updateMap(updated);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.map) this.map.remove();
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
    this.trackedOrder = order;
    setTimeout(() => this.initMap(order), 300);
  }

  closeTracking(): void {
    this.trackedOrder = null;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initMap(order: Order): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const lat = order.lat || 9.9281;
    const lng = order.lng || -84.0907;

    this.map = L.map('client-map').setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const clientIcon = L.divIcon({
      html: '<div style="font-size:28px">🏠</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (order.lat && order.lng) {
      this.clientMarker = L.marker([order.lat, order.lng], { icon: clientIcon })
        .addTo(this.map)
        .bindPopup(`<b>Tu dirección</b><br>${order.address}`)
        .openPopup();
    }

    this.updateMap(order);
  }

  updateMap(order: Order): void {
    if (!this.map) return;

    const deliveryIcon = L.divIcon({
      html: '<div style="font-size:28px">🛵</div>',
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
    return `~${etaMin} min (${dist.toFixed(1)} km)`;
  }

  goBack(): void {
    this.router.navigate(['/client/home']);
  }
}