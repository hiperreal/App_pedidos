import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CartPage } from './cart.page';

const routes: Routes = [{ path: '', component: CartPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class CartPageModule {}