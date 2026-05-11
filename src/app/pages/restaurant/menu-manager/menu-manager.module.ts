import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MenuManagerPageRoutingModule } from './menu-manager-routing.module';

import { MenuManagerPage } from './menu-manager.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuManagerPageRoutingModule
  ],
  declarations: [MenuManagerPage]
})
export class MenuManagerPageModule {}
