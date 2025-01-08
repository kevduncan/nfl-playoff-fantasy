import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'environments/environment';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Entry } from '../../../types/Entry';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public currentUser = this.auth.authState;
  constructor(
    private auth: AngularFireAuth,
    private snackbar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  async sendPasswordlessSignInLink(signInEmail: string): Promise<any> {
    try {
      const actionCodeSettings = {
        url: `${environment.appUrl}?email=${signInEmail}`,
        handleCodeInApp: true,
      };

      await this.auth.sendSignInLinkToEmail(signInEmail, actionCodeSettings);

      window.localStorage.setItem('emailForSignIn', signInEmail);

      this.snackbar.open('Sign-in link sent.', undefined, {
        duration: 5000,
        horizontalPosition: 'start',
        verticalPosition: 'bottom',
      });
    } catch (err) {
      console.error(err);

      let msg = 'An unknown error occurred.';
      switch (err.code) {
        case 'auth/missing-email':
        case 'auth/invalid-email':
          msg = 'Please enter a valid email address.';
          break;
        default:
          break;
      }

      this.snackbar.open(msg, undefined, {
        duration: 3500,
        horizontalPosition: 'start',
        verticalPosition: 'bottom',
      });

      throw err;
    }
  }

  async confirmSignIn() {
    let userEmail = window.localStorage.getItem('emailForSignIn');

    try {
      const urlEmail = this.activatedRoute.snapshot.queryParams.email;

      if (!userEmail || urlEmail !== userEmail) {
        userEmail = window.prompt(
          'It appears you followed this link from a different device than it was requested on, please input your email to verify your identity.'
        );
      }

      await this.auth.signInWithEmailLink(userEmail, this.router.url);
    } catch (err) {
      console.error(err);
      // auth/invalid-action-code
      let msg = 'An unknown error occurred.';
      switch (err.code) {
        case 'auth/invalid-action-code':
          msg = 'Sign-in link expired. Sending a new one...';
          setTimeout(() => {
            this.sendPasswordlessSignInLink(userEmail);
          }, 2000);
          break;
        default:
          break;
      }

      this.snackbar.open(msg, undefined, {
        duration: 3500,
        horizontalPosition: 'start',
        verticalPosition: 'bottom',
      });
    }
  }

  signOut() {
    this.auth.signOut();
  }

  getAuthUserEntry() {
    return this.auth.authState.pipe(
      switchMap((user) => {
        if (!user) {
          return of(null);
        }

        return this.firestore
          .collection<Entry>('entries', (ref) =>
            ref.where('email', '==', user.email?.toLocaleLowerCase())
          )
          .valueChanges();
      }),
      map((entries) => entries?.[0] || null)
    );
  }
}
