import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  activeMapId: number | null = null;
  private sub!: Subscription;
  private watchId: number | null = null;
  private map: L.Map | null = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
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

  ionViewDidLeave(): void {
    this.destroyMap();
    this.activeMapId = null;
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private waitForMapContainer(id: string, timeout = 2500): Promise<HTMLElement | null> {
    const start = performance.now();
    return new Promise(resolve => {
      const check = () => {
        const el = document.getElementById(id);
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          resolve(el);
          return;
        }
        if (performance.now() - start > timeout) {
          resolve(el);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  async toggleMap(order: DeliveryOrder): Promise<void> {
    if (this.activeMapId === order.id) {
      this.activeMapId = null;
      this.destroyMap();
      return;
    }

    this.destroyMap();
    this.activeMapId = order.id;
    this.cdr.detectChanges();

    const el = await this.waitForMapContainer('delivery-map');
    if (!el || this.activeMapId !== order.id) {
      return;
    }

    this.initMap(order, el);
  }

  initMap(order: DeliveryOrder, el: HTMLElement): void {
    el.innerHTML = '';
    el.style.height = '300px';
    el.style.width = '100%';
    el.style.display = 'block';
    el.style.position = 'relative';
    el.style.zIndex = '0';

    const clientLat = (order.lat && order.lat !== 0) ? order.lat : 9.9281;
    const clientLng = (order.lng && order.lng !== 0) ? order.lng : -84.0907;

    this.map = L.map(el, {
      zoomControl: true,
      preferCanvas: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([clientLat, clientLng], 15);

    const map = this.map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      crossOrigin: true,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(map);

    map.whenReady(() => {
      setTimeout(() => {
        map.invalidateSize(true);
        map.setView([clientLat, clientLng], 15);
      }, 200);
    });

    setTimeout(() => {
      map.invalidateSize(true);
      map.setView([clientLat, clientLng], 15);
    }, 700);

    const clientIcon = L.divIcon({
      html: '<div style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🏠</div>',
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    L.marker([clientLat, clientLng], { icon: clientIcon })
      .addTo(map)
      .bindPopup(`<b>📍 Entregar aquí</b><br>${order.address || 'Dirección del cliente'}`)
      .openPopup();

    this.startTracking(order);
  }

  startTracking(order: DeliveryOrder): void {
    if (!navigator.geolocation || !this.map) return;
    const map = this.map;

    let deliveryMarker: L.Marker | null = null;
    let routeLine: L.Polyline | null = null;
    let etaControl: L.Control | null = null;

    const deliveryIcon = L.divIcon({
      html: '<div style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🛵</div>',
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const clientLat = (order.lat && order.lat !== 0) ? order.lat : 0;
    const clientLng = (order.lng && order.lng !== 0) ? order.lng : 0;

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

        if (clientLat !== 0 && clientLng !== 0) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(
            [[dLat, dLng], [clientLat, clientLng]],
            { color: '#ffc107', weight: 4, dashArray: '8,8' }
          ).addTo(map);

          const dist = this.calcDistance(dLat, dLng, clientLat, clientLng);
          const etaMin = Math.ceil((dist / 30) * 60);

          if (etaControl) map.removeControl(etaControl);
          const EtaControl = L.Control.extend({
            onAdd: () => {
              const div = L.DomUtil.create('div');
              div.innerHTML = `
                <div style="background:#1e1e1e;border:2px solid #ffc107;border-radius:10px;
                            padding:8px 14px;color:#fff;font-size:13px;font-weight:600;">
                  ⏱ ETA: ~${etaMin} min &nbsp;·&nbsp; ${dist.toFixed(1)} km
                </div>`;
              return div;
            }
          });
          etaControl = new EtaControl({ position: 'bottomleft' });
          etaControl.addTo(map);

          map.fitBounds(
            [[dLat, dLng], [clientLat, clientLng]],
            { padding: [50, 50] }
          );
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
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  advance(order: DeliveryOrder): void {
    const flow: DeliveryStatus[] = ['sent', 'picking', 'onway', 'delivered'];
    const idx = flow.indexOf(order.deliveryStatus);
    if (idx < flow.length - 1) order.deliveryStatus = flow[idx + 1];
  }

  getStatusLabel(status: DeliveryStatus): string {
    const labels: Record<DeliveryStatus, string> = {
      sent: '📦 Listo para recoger',
      picking: '🛵 Recogiendo pedido',
      onway: '🚀 En camino',
      delivered: '✅ Entregado',
    };
    return labels[status];
  }

  getNextLabel(status: DeliveryStatus): string {
    const labels: Record<DeliveryStatus, string> = {
      sent: 'Recoger pedido',
      picking: 'Salir a entregar',
      onway: 'Marcar entregado',
      delivered: 'Entregado',
    };
    return labels[status];
  }

  getStatusColor(status: DeliveryStatus): string {
    const colors: Record<DeliveryStatus, string> = {
      sent: '#FF6B00',
      picking: '#FFC107',
      onway: '#2196F3',
      delivered: '#4CAF50',
    };
    return colors[status];
  }

  isDelivered(order: DeliveryOrder): boolean {
    return order.deliveryStatus === 'delivered';
  }

  toggleOnline(): void { this.isOnline = !this.isOnline; }

  goBack(): void { this.router.navigate(['/login']); }
}