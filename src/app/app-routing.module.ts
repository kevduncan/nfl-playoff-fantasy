import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { StatEntryComponent } from './stat-entry/stat-entry.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'stat-entry', component: StatEntryComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
