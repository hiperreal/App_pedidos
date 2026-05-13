import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuManagerPage } from './menu-manager.page';

const routes: Routes = [
  {
    path: '',
    component: MenuManagerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuManagerPageRoutingModule {}
