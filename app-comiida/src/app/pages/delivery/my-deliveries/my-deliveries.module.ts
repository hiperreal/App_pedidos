import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyDeliveriesPageRoutingModule } from './my-deliveries-routing.module';

import { MyDeliveriesPage } from './my-deliveries.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyDeliveriesPageRoutingModule
  ],
  declarations: [MyDeliveriesPage]
})
export class MyDeliveriesPageModule {}
