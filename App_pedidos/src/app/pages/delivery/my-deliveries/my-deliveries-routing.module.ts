import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyDeliveriesPage } from './my-deliveries.page';

const routes: Routes = [
  {
    path: '',
    component: MyDeliveriesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyDeliveriesPageRoutingModule {}