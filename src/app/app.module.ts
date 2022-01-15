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

const firebaseConfig = {
  apiKey: "AIzaSyDRhGh80TCupWE9ux6nYVJWMKIld4uuThY",
  authDomain: "nfl-fantasy-playoffs-9af36.firebaseapp.com",
  projectId: "nfl-fantasy-playoffs-9af36",
  storageBucket: "nfl-fantasy-playoffs-9af36.appspot.com",
  messagingSenderId: "108862090438",
  appId: "1:108862090438:web:68576309771ebc6687bbc7"
};

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    StatEntryComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule, // firestore
    AngularFireAuthModule, // auth
    AngularFireStorageModule, // storage
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
