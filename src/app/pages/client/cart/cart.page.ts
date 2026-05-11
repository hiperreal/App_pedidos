import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastController, IonHeader, IonContent, IonFooter, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartItem } from '../../../core/models/menu.model';
import { CartService } from '../../../core/services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  imports: [IonTitle, IonToolbar, CommonModule, FormsModule, IonHeader, IonContent, IonFooter],
})
export class CartPage implements OnInit, OnDestroy {
  items: CartItem[] = [];
  payMethod: string = 'card';
  cashAmount: string = '';
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
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  get subtotal(): number    { return this.cartService.subtotal; }
  get deliveryFee(): number { return this.cartService.deliveryFee; }
  get total(): number       { return this.cartService.total; }

  fmt(val: number): string { return val.toFixed(2); }

  remove(uid: number): void { this.cartService.removeItem(uid); }

  selectPay(method: string): void {
    this.payMethod = method;
    if (method === 'card') this.cashAmount = '';
  }

  async placeOrder(): Promise<void> {
    if (!this.items.length) return;
    const payLabel = this.payMethod === 'cash'
      ? `Efectivo ($${this.cashAmount})` : 'Tarjeta';
    const num = this.cartService.placeOrder(payLabel);
    const toast = await this.toastCtrl.create({
      message: `✅ Pedido ${num} enviado al restaurante`,
      duration: 2500, color: 'dark', position: 'top',
    });
    await toast.present();
    this.router.navigate(['/client/home']);
  }

  goBack(): void { this.router.navigate(['/client/home']); }
}