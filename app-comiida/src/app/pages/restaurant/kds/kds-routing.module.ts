import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KdsPage } from './kds.page';

const routes: Routes = [
  {
    path: '',
    component: KdsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KdsPageRoutingModule {}
