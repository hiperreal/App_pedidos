import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { KdsPageRoutingModule } from './kds-routing.module';
import { KdsPage } from './kds.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    KdsPageRoutingModule,
  ],
  declarations: [KdsPage],
})
export class KdsPageModule {}