import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { PlayerSelectionsComponent } from './player-selections/player-selections.component';
import { LineupFormComponent } from './lineup-form/lineup-form.component';
import { UserEntryResolver } from './_resolvers/user-entry.resolver';
import { PreOpenGuard } from './_guards/pre-open.guard';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  // { path: 'stat-entry', component: StatEntryComponent },
  { path: 'breakdown', component: PlayerSelectionsComponent },
  {
    path: 'lineup-entry',
    component: LineupFormComponent,
    canActivate: [PreOpenGuard],
    resolve: {
      existingEntry: UserEntryResolver,
    },
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
