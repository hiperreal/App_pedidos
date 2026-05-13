import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuItem, MENU_CATEGORIES, MENU_ITEMS } from '../../../core/models/menu.model';
import { CartService } from '../../../core/services/cart';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  categories: string[] = MENU_CATEGORIES;
  allItems: MenuItem[] = MENU_ITEMS;
  filteredItems: MenuItem[] = [];
  activeCat: string = 'Todos';
  sectionTitle: string = 'Lo más pedido';
  cartCount: number = 0;
  userRole: string = '';
  private sub!: Subscription;

  constructor(
    public router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.filteredItems = [...this.allItems];
    this.sub = this.cartService.cart$.subscribe(
      (items) => { this.cartCount = items.length; }
    );

    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      console.log('USUARIO ACTUAL:', user);
      if (user) {
        const db = getFirestore();
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          this.userRole = (snap.data() as any)['role'];
          console.log('ROL DEL USUARIO:', this.userRole);
        } else {
          console.log('NO SE ENCONTRÓ EL DOCUMENTO DEL USUARIO');
        }
      } else {
        console.log('NO HAY USUARIO AUTENTICADO');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  filterCat(cat: string): void {
    this.activeCat = cat;
    this.sectionTitle = cat === 'Todos' ? 'Lo más pedido' : cat;
    this.filteredItems = cat === 'Todos'
      ? [...this.allItems]
      : this.allItems.filter((i: MenuItem) => i.category === cat);
  }

  openDetail(item: MenuItem): void {
    this.router.navigate(['/client/detail', item.id]);
  }

  goToCart(): void {
    this.router.navigate(['/client/cart']);
  }

  goToKds(): void {
    this.router.navigate(['/restaurant/kds']);
  }

  goToOrders(): void {
    this.router.navigate(['/client/orders']);
  }
}