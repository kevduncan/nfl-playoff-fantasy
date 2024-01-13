import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { combineLatest, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { PlayerStatsDialogComponent } from 'app/_dialogs/player-stats-dialog/player-stats-dialog.component';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit {
  public loading = true;
  public opened = false;

  public lineupOrder = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    K: 5,
  };

  stats$: Observable<any[]>;
  teams$: Observable<any[]>;
  players$: Observable<any[]>;
  entries$: Observable<any[]>;
  scoreboardData$: Observable<any[]>;
  scoring: any;
  poolIsOpen$: Observable<boolean>;
  signInEmail: string;
  user$: Observable<firebase.User>;
  userEntry: {
    teamName: any;
    email: any;
    roster: any[];
    totalPoints: number;
    remainingPlayers: number;
    isValid: boolean;
  };
  userRank: number;

  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private snackbar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.activatedRoute.snapshot.queryParams.email) {
      this.confirmSignIn();
      this.router.navigate(['/'], { queryParams: {} });
    }

    this.poolIsOpen$ = this.firestore
      .doc(`settings/general`)
      .valueChanges()
      .pipe(
        map((generalSettings: { open: boolean }) => {
          return true;
          // return generalSettings.open;
        }),
        tap(() => (this.loading = false))
      );

    this.user$ = this.auth.authState;

    this.scoring = await this.firestore
      .doc('scoring/points')
      .valueChanges()
      .pipe(take(1))
      .toPromise();

    this.stats$ = this.firestore.collection('stats').valueChanges();
    this.teams$ = this.firestore.collection('teams').valueChanges();
    this.players$ = this.firestore.collection('players').valueChanges();
    this.entries$ = this.firestore.collection('entries').valueChanges();

    this.scoreboardData$ = combineLatest([
      this.stats$,
      this.teams$,
      this.players$,
      this.entries$,
      this.user$,
    ]).pipe(
      map(([stats, teams, allPlayers, entries, user]) => {
        const playersWithScores = allPlayers.map((player) => {
          let playerTotalPoints = 0;
          const playerStats = stats
            .filter((stat) => stat.playerId === player.id)
            .map((stat) => {
              let singleGamePoints = 0;
              Object.keys(stat.statLine).forEach((key) => {
                const statAmount = stat.statLine[key] || 0;
                const statScoring = this.scoring[key] || 0;

                singleGamePoints += statAmount * statScoring;
              });
              playerTotalPoints += singleGamePoints;
              return {
                ...stat,
                gamePoints: singleGamePoints,
              };
            });

          return { ...player, points: playerTotalPoints, playerStats };
        });

        const entriesWithRosters = entries.map((entry) => {
          let totalPoints = 0;
          let remainingPlayers = 0;

          const isValid = entry.players.length === _.uniq(entry.players).length;

          const roster = playersWithScores
            .filter((player) => entry.players.some((id) => id === player.id))
            .map((player) => {
              const playerTeam = teams.find(
                (team) => team.abbr === player.team
              );

              return {
                ...player,
                teamLogo: playerTeam ? playerTeam.logoUrl : '',
                eliminated: playerTeam ? playerTeam.eliminated : false,
              };
            });

          roster.forEach((player) => {
            totalPoints += player.points;
            if (!player.eliminated) remainingPlayers += 1;
          });

          // sort roster based on lineup order
          const sorted = _.sortBy(roster, (player) => {
            return this.lineupOrder[player.pos];
          });

          return {
            teamName: entry.teamName,
            email: entry.email,
            roster: sorted,
            totalPoints: totalPoints,
            remainingPlayers,
            isValid,
          };
        });

        const orderedEntries = _.orderBy(
          entriesWithRosters.filter((entry) => entry.isValid),
          ['totalPoints', 'teamName'],
          ['desc', 'asc']
        );

        this.userEntry = user
          ? orderedEntries.find((entry, idx) => {
              const match =
                entry.email?.toLowerCase() === user.email.toLowerCase();
              this.userRank = idx + 1;
              return match;
            })
          : null;

        return orderedEntries;
      })
    );
  }

  openStatsDialog(entry) {
    const dialogRef = this.dialog.open(PlayerStatsDialogComponent, {
      data: entry,
    });
  }

  totalPointsChange(index, entry) {
    return entry.totalPoints;
  }

  async sendPasswordlessSignInLink(): Promise<any> {
    try {
      const actionCodeSettings = {
        url: `${environment.appUrl}?email=${this.signInEmail}`,
        handleCodeInApp: true,
      };

      await this.auth.sendSignInLinkToEmail(
        this.signInEmail,
        actionCodeSettings
      );

      window.localStorage.setItem('emailForSignIn', this.signInEmail);

      this.snackbar.open('Sign in link sent.', undefined, {
        duration: 3500,
        horizontalPosition: 'start',
        verticalPosition: 'bottom',
      });

      this.signInEmail = null;
      this.opened = false;
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
    }
  }

  async confirmSignIn() {
    try {
      let userEmail = window.localStorage.getItem('emailForSignIn');
      const urlEmail = this.activatedRoute.snapshot.queryParams.email;

      if (!userEmail || urlEmail !== userEmail) {
        userEmail = window.prompt(
          'It appears you followed this link from a different device than it was requested on, please input your email to verify your identity.'
        );
      }

      await this.auth.signInWithEmailLink(userEmail, this.router.url);
    } catch (err) {
      console.error(err);
    }
  }

  signOut() {
    this.auth.signOut();
  }
}
