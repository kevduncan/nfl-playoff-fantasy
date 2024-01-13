import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { HomePageComponent } from './home-page/home-page.component';

import { MaterialModule } from './material.module';
import { StatEntryComponent } from './stat-entry/stat-entry.component';
import { CommonModule } from '@angular/common';
import { PlayerStatsDialogComponent } from './_dialogs/player-stats-dialog/player-stats-dialog.component';
import { PointsSortPipe } from './_pipes/points-sort.pipe';
import { FormsModule } from '@angular/forms';
import { environment } from 'environments/environment';
import { NgChartsModule } from 'ng2-charts';
import { PlayerSelectionsComponent } from './player-selections/player-selections.component';

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    StatEntryComponent,
    PlayerStatsDialogComponent,
    PointsSortPipe,
    PlayerSelectionsComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule, // firestore
    AngularFireAuthModule, // auth
    AngularFireStorageModule, // storage
    MaterialModule,
    NgChartsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
