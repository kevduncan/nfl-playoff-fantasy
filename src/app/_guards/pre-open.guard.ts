import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CanActivate, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PreOpenGuard implements CanActivate {
  constructor(private firestore: AngularFirestore) {}

  canActivate():
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.firestore
      .doc(`settings/general`)
      .valueChanges()
      .pipe(
        map((generalSettings: { open: boolean }) => {
          return !generalSettings.open;
        }),
        first()
      );
  }
}
