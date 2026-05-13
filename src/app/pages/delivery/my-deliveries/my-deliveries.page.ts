import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';
import * as L from 'leaflet';

type DeliveryStatus = 'sent' | 'picking' | 'onway' | 'delivered';

interface DeliveryOrder extends Order {
  deliveryStatus: DeliveryStatus;
}

@Component({
  selector: 'app-my-deliveries',
  standalone: false,
  templateUrl: './my-deliveries.page.html',
  styleUrls: ['./my-deliveries.page.scss'],
})
export class MyDeliveriesPage implements OnInit, OnDestroy {
  orders: DeliveryOrder[] = [];
  isOnline: boolean = true;
  private sub!: Subscription;
  private watchId: number | null = null;
  private maps: Map<number, L.Map> = new Map();
  private invalidateIntervals: Map<number, any> = new Map();

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(data => {
      const existing = new Map(this.orders.map(o => [o.id, o.deliveryStatus]));
      this.orders = data.sent.map(o => ({
        ...o,
        deliveryStatus: existing.get(o.id) ?? 'sent'
      }));
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.maps.forEach(m => m.remove());
    this.invalidateIntervals.forEach(i => clearInterval(i));
  }

  initMap(order: DeliveryOrder): void {
    setTimeout(() => {
      const mapId = `map-${order.id}`;
      const el = document.getElementById(mapId);
      if (!el) return;

      if (this.maps.has(order.id)) {
        this.maps.get(order.id)!.remove();
        this.maps.delete(order.id);
      }
      if (this.invalidateIntervals.has(order.id)) {
        clearInterval(this.invalidateIntervals.get(order.id));
      }

      el.innerHTML = '';
      el.style.height = '280px';
      el.style.width = '100%';

      const clientLat = order.lat ?? 9.9281;
      const clientLng = order.lng ?? -84.0907;

      const map = L.map(el, {
        zoomControl: true,
        preferCanvas: false,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false,
        inertia: false,
      }).setView([clientLat, clientLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 8,
      }).addTo(map);

      // Invalidar cada 200ms por 6 segundos
      const interval = setInterval(() => map.invalidateSize(true), 200);
      this.invalidateIntervals.set(order.id, interval);
      setTimeout(() => {
        clearInterval(interval);
        this.invalidateIntervals.delete(order.id);
      }, 6000);

      map.on('zoomstart', () => {
  el.style.opacity = '0.99';
  map.invalidateSize(true);
});

map.on('zoom', () => {
  map.invalidateSize(true);
});

map.on('zoomend', () => {
  el.style.opacity = '1';
  [0, 50, 100, 200, 400, 800, 1200].forEach(t =>
    setTimeout(() => {
      map.invalidateSize(true);
      map.eachLayer((layer: any) => {
        if (layer._tiles) {
          Object.values(layer._tiles).forEach((tile: any) => {
            if (tile.el) tile.el.style.opacity = '1';
          });
        }
      });
    }, t)
  );
});

map.on('moveend', () => {
  map.invalidateSize(true);
});

      const clientIcon = L.divIcon({
        html: '<div style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🏠</div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const clientMarker = L.marker([clientLat, clientLng], { icon: clientIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Entregar aquí</b><br>${order.address || 'Dirección del cliente'}`);
      clientMarker.openPopup();

      this.maps.set(order.id, map);
      this.startTracking(order);
    }, 800);
  }

  startTracking(order: DeliveryOrder): void {
    if (!navigator.geolocation) return;
    const map = this.maps.get(order.id);
    if (!map) return;

    let deliveryMarker: L.Marker | null = null;
    let routeLine: L.Polyline | null = null;
    let etaDiv: L.Control | null = null;

    const deliveryIcon = L.divIcon({
      html: '<div style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🛵</div>',
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const clientLat = order.lat ?? 0;
    const clientLng = order.lng ?? 0;

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const dLat = pos.coords.latitude;
        const dLng = pos.coords.longitude;

        this.cartService.updateDeliveryLocation(order.id, dLat, dLng);

        if (!deliveryMarker) {
          deliveryMarker = L.marker([dLat, dLng], { icon: deliveryIcon })
            .addTo(map)
            .bindPopup('🛵 Tu ubicación');
        } else {
          deliveryMarker.setLatLng([dLat, dLng]);
        }

        map.invalidateSize(true);

        if (clientLat !== 0 && clientLng !== 0) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(
            [[dLat, dLng], [clientLat, clientLng]],
            { color: '#ffc107', weight: 4, dashArray: '8,8' }
          ).addTo(map);

          const dist = this.calcDistance(dLat, dLng, clientLat, clientLng);
          const etaMin = Math.ceil((dist / 30) * 60);

          if (etaDiv) map.removeControl(etaDiv);
          const EtaControl = L.Control.extend({
            onAdd: () => {
              const div = L.DomUtil.create('div');
              div.innerHTML = `
                <div style="background:#1e1e1e;border:2px solid #ffc107;border-radius:10px;padding:8px 14px;color:#fff;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
                  ⏱ ETA: ~${etaMin} min &nbsp;·&nbsp; ${dist.toFixed(1)} km
                </div>`;
              return div;
            }
          });
          etaDiv = new EtaControl({ position: 'bottomleft' });
          etaDiv.addTo(map);

          map.fitBounds([[dLat, dLng], [clientLat, clientLng]], { padding: [50, 50] });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }

  calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  advance(order: DeliveryOrder): void {
    const flow: DeliveryStatus[] = ['sent', 'picking', 'onway', 'delivered'];
    const idx = flow.indexOf(order.deliveryStatus);
    if (idx < flow.length - 1) {
      order.deliveryStatus = flow[idx + 1];
      if (order.deliveryStatus === 'onway') {
        this.initMap(order);
      }
    }
  }

  getStatusLabel(status: DeliveryStatus): string {
    const labels: Record<DeliveryStatus, string> = {
      sent:      '📦 Listo para recoger',
      picking:   '🛵 Recogiendo pedido',
      onway:     '🚀 En camino',
      delivered: '✅ Entregado',
    };
    return labels[status];
  }

  getNextLabel(status: DeliveryStatus): string {
    const labels: Record<DeliveryStatus, string> = {
      sent:      'Recoger pedido',
      picking:   'Salir a entregar',
      onway:     'Marcar entregado',
      delivered: 'Entregado',
    };
    return labels[status];
  }

  getStatusColor(status: DeliveryStatus): string {
    const colors: Record<DeliveryStatus, string> = {
      sent:      '#FF6B00',
      picking:   '#FFC107',
      onway:     '#2196F3',
      delivered: '#4CAF50',
    };
    return colors[status];
  }

  isDelivered(order: DeliveryOrder): boolean {
    return order.deliveryStatus === 'delivered';
  }

  toggleOnline(): void {
    this.isOnline = !this.isOnline;
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}