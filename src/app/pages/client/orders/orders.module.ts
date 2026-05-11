import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { OrdersPageRoutingModule } from './orders-routing.module';
import { OrdersPage } from './orders.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    OrdersPageRoutingModule,
  ],
  declarations: [OrdersPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OrdersPageModule {}
