import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastController, IonHeader, IonContent, IonFooter } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartItem } from '../../../core/models/menu.model';
import { CartService } from '../../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  imports: [CommonModule, FormsModule, IonHeader, IonContent, IonFooter],
})
export class CartPage implements OnInit, OnDestroy {
  items: CartItem[] = [];
  payMethod: string = 'card';
  cashAmount: string = '';
  address: string = '';
  locating: boolean = false;
  locError: string = '';
  userLat: number = 0;
  userLng: number = 0;
  private sub!: Subscription;

  constructor(
    private router: Router,
    private cartService: CartService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
  this.sub = this.cartService.cart$.subscribe(
    (items) => { this.items = items; }
  );
  this.detectLocation();
}

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  get subtotal(): number    { return this.cartService.subtotal; }
  get deliveryFee(): number { return this.cartService.deliveryFee; }
  get total(): number       { return this.cartService.total; }

  fmt(val: number): string { return val.toFixed(2); }

  extrasLabel(item: CartItem): string {
    return item.extras.map(e => e.name).join(', ');
  }

  remove(uid: number): void { this.cartService.removeItem(uid); }

  selectPay(method: string): void {
    this.payMethod = method;
    if (method === 'card') this.cashAmount = '';
  }

  detectLocation(): void {
    if (!navigator.geolocation) {
      this.locError = 'Tu dispositivo no soporta geolocalización';
      return;
    }
    this.locating = true;
    this.locError = '';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        this.userLat = pos.coords.latitude;
        this.userLng = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${this.userLat}&lon=${this.userLng}&format=json`
          );
          const data = await res.json();
          this.address = data.display_name ?? `${this.userLat}, ${this.userLng}`;
        } catch {
          this.address = `${this.userLat.toFixed(5)}, ${this.userLng.toFixed(5)}`;
        }
        this.locating = false;
      },
      () => {
        this.locError = 'No se pudo obtener la ubicación. Escríbela manualmente.';
        this.locating = false;
      },
      { timeout: 10000 }
    );
  }

  async placeOrder(): Promise<void> {
    if (!this.items.length) return;
    if (!this.address.trim()) {
      this.locError = 'Por favor ingresa o detecta tu dirección.';
      return;
    }
    const payLabel = this.payMethod === 'cash'
      ? `Efectivo ($${this.cashAmount})` : 'Tarjeta';
    const num = this.cartService.placeOrder(
      payLabel,
      this.address,
      this.userLat,
      this.userLng
    );
    const toast = await this.toastCtrl.create({
      message: `✅ Pedido ${num} enviado al restaurante`,
      duration: 2500, color: 'dark', position: 'top',
    });
    await toast.present();
    this.router.navigate(['/client/home']);
  }

  goBack(): void { this.router.navigate(['/client/home']); }
}