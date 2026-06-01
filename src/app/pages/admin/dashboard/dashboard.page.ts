import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart';
import { Order } from '../../../core/models/menu.model';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ToastController } from '@ionic/angular';


@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  totalOrders: number = 0;
  totalRevenue: number = 0;
  pendingOrders: number = 0;
  cookingOrders: number = 0;
  sentOrders: number = 0;
  allOrders: Order[] = [];
  topProducts: { name: string; count: number; emoji: string }[] = [];
  private sub!: Subscription;

  // Formulario de nuevo trabajador
  showWorkerForm: boolean = false;
  workerName: string = '';
  workerEmail: string = '';
  workerPassword: string = '';
  workerRole: string = 'delivery';
  creatingWorker: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.sub = this.cartService.orders$.subscribe(data => {
      this.pendingOrders = data.pending.length;
      this.cookingOrders = data.cooking.length;
      this.sentOrders    = data.sent.length;
      this.allOrders     = [...data.pending, ...data.cooking, ...data.sent];
      this.totalOrders   = this.allOrders.length;
      this.totalRevenue  = this.allOrders.reduce((sum, o) => sum + o.total, 0);
      this.calcTopProducts();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  calcTopProducts(): void {
    const map = new Map<string, { count: number; emoji: string }>();
    this.allOrders.forEach(order => {
      order.items.forEach(item => {
        const match = item.match(/^(\S+)\s(.+?)\s\(/);
        if (match) {
          const emoji = match[1];
          const name  = match[2];
          const prev  = map.get(name) ?? { count: 0, emoji };
          map.set(name, { count: prev.count + 1, emoji });
        }
      });
    });
    this.topProducts = Array.from(map.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  async createWorker(): Promise<void> {
    if (!this.workerName || !this.workerEmail || !this.workerPassword) {
      this.showToast('Completa todos los campos', 'danger');
      return;
    }
    if (this.workerPassword.length < 6) {
      this.showToast('La contraseña debe tener al menos 6 caracteres', 'danger');
      return;
    }
    this.creatingWorker = true;
    try {
      const auth = getAuth();
      const db   = getFirestore();
      const cred = await createUserWithEmailAndPassword(
        auth, this.workerEmail, this.workerPassword
      );
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid:   cred.user.uid,
        name:  this.workerName,
        email: this.workerEmail,
        role:  this.workerRole
      });
      this.showToast('✅ Trabajador creado exitosamente', 'success');
      this.workerName = '';
      this.workerEmail = '';
      this.workerPassword = '';
      this.workerRole = 'delivery';
      this.showWorkerForm = false;
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use'
        ? 'Ese correo ya está registrado'
        : 'Error al crear el trabajador';
      this.showToast(msg, 'danger');
    }
    this.creatingWorker = false;
  }

  async showToast(msg: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message: msg, duration: 2500, color, position: 'top'
    });
    await t.present();
  }

  goToKds(): void { this.router.navigate(['/restaurant/kds']); }
  logout(): void  { this.router.navigate(['/login']); }
}