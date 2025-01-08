import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/_services/auth.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  public opened = false;
  poolIsOpen$: Observable<boolean>;
  user$: Observable<firebase.User>;
  signInEmail: string;
  sentLink: string;
  banner$: Observable<string>;
  bannerDismissed = false;

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public authService: AuthService
  ) {}

  test(e: Event) {
    e.stopPropagation();
  }
  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((queryParams) => {
      if (queryParams.email) {
        this.authService.confirmSignIn();
        this.router.navigate(['/'], { queryParams: {} });
      }
    });

    this.banner$ = this.firestore
      .doc(`settings/banners`)
      .valueChanges()
      .pipe(map((bannerMap: any) => bannerMap?.homepage));

    this.poolIsOpen$ = this.firestore
      .doc(`settings/general`)
      .valueChanges()
      .pipe(
        map((generalSettings: { open: boolean }) => {
          return generalSettings.open;
        })
      );

    this.user$ = this.auth.authState;
  }

  async sendSignInLink() {
    try {
      this.sentLink = '';
      await this.authService.sendPasswordlessSignInLink(this.signInEmail);
      this.sentLink = `Sent link to ${this.signInEmail}`;
      this.signInEmail = '';
    } catch (err) {
      console.error(err);
    }
  }
}
