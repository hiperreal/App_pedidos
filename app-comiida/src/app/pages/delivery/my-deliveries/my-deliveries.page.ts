import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';
import * as L from 'leaflet';

type DeliveryStatus = 'sent' | 'picking' | 'onway' | 'delivered';

interface DeliveryOrder extends Order {
  deliveryStatus: DeliveryStatus;
  map?: L.Map;
  marker?: L.Marker;
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
  selectedOrder: DeliveryOrder | null = null;
  private sub!: Subscription;
  private watchId: number | null = null;
  private maps: Map<number, L.Map> = new Map();

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
  }

  initMap(order: DeliveryOrder): void {
    setTimeout(() => {
      const mapId = `map-${order.id}`;
      const el = document.getElementById(mapId);
      if (!el || this.maps.has(order.id)) return;

      const defaultLat = order.lat || 9.9281;
      const defaultLng = order.lng || -84.0907;

      const map = L.map(mapId, { zoomControl: true }).setView([defaultLat, defaultLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Marcador del cliente
      if (order.lat && order.lng) {
        const clientIcon = L.divIcon({
          html: '<div style="font-size:28px">🏠</div>',
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        L.marker([order.lat, order.lng], { icon: clientIcon })
          .addTo(map)
          .bindPopup(`<b>Cliente</b><br>${order.address}`)
          .openPopup();
      }

      this.maps.set(order.id, map);
      this.startTracking(order);
    }, 300);
  }

  startTracking(order: DeliveryOrder): void {
    if (!navigator.geolocation) return;

    const map = this.maps.get(order.id);
    if (!map) return;

    let deliveryMarker: L.Marker | null = null;
    let routeLine: L.Polyline | null = null;
    let etaDiv: L.Control | null = null;

    const deliveryIcon = L.divIcon({
      html: '<div style="font-size:28px">🛵</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const dLat = pos.coords.latitude;
        const dLng = pos.coords.longitude;

        this.cartService.updateDeliveryLocation(order.id, dLat, dLng);

        if (!deliveryMarker) {
          deliveryMarker = L.marker([dLat, dLng], { icon: deliveryIcon })
            .addTo(map)
            .bindPopup('🛵 Repartidor');
        } else {
          deliveryMarker.setLatLng([dLat, dLng]);
        }

        // Dibujar línea entre repartidor y cliente
        if (order.lat && order.lng) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(
            [[dLat, dLng], [order.lat, order.lng]],
            { color: '#ffc107', weight: 3, dashArray: '6,6' }
          ).addTo(map);

          // Calcular distancia y tiempo estimado
          const dist = this.calcDistance(dLat, dLng, order.lat, order.lng);
          const etaMin = Math.ceil((dist / 30) * 60); // 30 km/h promedio

          // Mostrar ETA en el mapa
          if (etaDiv) map.removeControl(etaDiv);
          const EtaControl = L.Control.extend({
            onAdd: () => {
              const div = L.DomUtil.create('div');
              div.innerHTML = `
                <div style="background:#1e1e1e;border:1px solid #ffc107;border-radius:10px;padding:8px 14px;color:#fff;font-size:13px;font-weight:600;">
                  ⏱ ETA: ~${etaMin} min &nbsp;·&nbsp; ${dist.toFixed(1)} km
                </div>`;
              return div;
            }
          });
          etaDiv = new EtaControl({ position: 'bottomleft' });
          etaDiv.addTo(map);

          // Centrar mapa entre los dos puntos
          map.fitBounds([[dLat, dLng], [order.lat, order.lng]], { padding: [40, 40] });
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