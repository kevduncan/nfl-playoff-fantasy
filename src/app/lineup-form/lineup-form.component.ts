import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest } from 'rxjs';
import { Player } from '../../../types/Player';
import { Entry } from '../../../types/Entry';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first, map } from 'rxjs/operators';
import { uniq } from 'lodash';
import { Filter } from 'bad-words';
import { AuthService } from 'app/_services/auth.service';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lineup-form',
  templateUrl: './lineup-form.component.html',
  styleUrls: ['./lineup-form.component.scss'],
})
export class LineupFormComponent implements OnInit {
  poolIsOpen$: Observable<boolean>;
  allPlayers$: Observable<Player[]>;
  lineupForm: FormGroup;
  selectedPlayerMap: { [key: string]: Player } = {};
  lineupError: null | string;
  submittingLineup: boolean;
  currentUser: firebase.User;
  authUserEntry: Entry | null;
  bracketImage$: Observable<string>;

  lineupSlots = [
    {
      label: 'QB',
      formControlName: 'qb1',
      validPositions: ['QB'],
    },
    {
      label: 'QB',
      formControlName: 'qb2',
      validPositions: ['QB'],
    },
    {
      label: 'RB',
      formControlName: 'rb1',
      validPositions: ['RB'],
    },
    {
      label: 'RB',
      formControlName: 'rb2',
      validPositions: ['RB'],
    },
    {
      label: 'WR',
      formControlName: 'wr1',
      validPositions: ['WR'],
    },
    {
      label: 'WR',
      formControlName: 'wr2',
      validPositions: ['WR'],
    },
    {
      label: 'WR',
      formControlName: 'wr3',
      validPositions: ['WR'],
    },
    {
      label: 'TE',
      formControlName: 'te1',
      validPositions: ['TE'],
    },
    {
      label: 'TE',
      formControlName: 'te2',
      validPositions: ['TE'],
    },
    {
      label: 'FLEX',
      formControlName: 'flex1',
      validPositions: ['WR', 'RB', 'TE'],
    },
    {
      label: 'FLEX',
      formControlName: 'flex2',
      validPositions: ['WR', 'RB', 'TE'],
    },
  ];

  get selectedPlayerIds() {
    return Object.entries(this.lineupForm.value)
      .map(([key, value]) => {
        if (!['teamName', 'venmoHandle', 'formEmail'].includes(key)) {
          return value;
        }
      })
      .filter(Boolean);
  }

  constructor(
    private firestore: AngularFirestore,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authUserEntry = this.activatedRoute.snapshot.data['existingEntry'];
    this.authService.getAuthUserEntry().subscribe((entry: Entry | null) => {
      this.authUserEntry = entry;
    });
    this.authService.currentUser.subscribe((user) => {
      if (user) {
        this.lineupForm.get('formEmail').disable();
      } else {
        this.lineupForm.get('formEmail').enable();
      }
    });

    this.poolIsOpen$ = this.firestore
      .doc(`settings/general`)
      .valueChanges()
      .pipe(
        map((generalSettings: { open: boolean }) => {
          return generalSettings.open;
        })
      );

    this.bracketImage$ = this.firestore
      .doc(`settings/images`)
      .valueChanges()
      .pipe(map((imageMap: any) => imageMap?.currentPlayoffBracket));

    const formGroupMap = {};
    this.lineupSlots.forEach((slot) => {
      const storageSlotPlayerId =
        this.authUserEntry?.formValues?.[slot.formControlName] ||
        localStorage.getItem(slot.formControlName);
      formGroupMap[slot.formControlName] = [
        storageSlotPlayerId || null,
        [Validators.required],
      ];
    });

    this.lineupForm = this.formBuilder.group({
      teamName: [
        this.authUserEntry?.teamName ||
          localStorage.getItem('teamName') ||
          null,
        [Validators.required],
      ],
      venmoHandle: [
        this.authUserEntry?.venmo ||
          localStorage.getItem('venmoHandle') ||
          null,
        [Validators.required],
      ],
      formEmail: [
        this.authUserEntry?.email || localStorage.getItem('formEmail') || null,
        [Validators.required, Validators.email],
      ],
      ...formGroupMap,
    });

    this.allPlayers$ = this.firestore
      .collection<Player>('players', (ref) =>
        ref.orderBy('fantasyPprPoints', 'desc')
      )
      .valueChanges()
      .pipe(first());

    combineLatest([this.allPlayers$, this.lineupForm.valueChanges]).subscribe(
      ([allPlayers, formValue]) => {
        Object.entries(formValue).forEach(
          ([formKey, formValue]: [string, string]) => {
            if (formValue) {
              if (['teamName', 'venmoHandle', 'formEmail'].includes(formKey)) {
                localStorage.setItem(formKey, formValue);
              } else {
                const player = allPlayers.find((p) => p.id === formValue);
                if (player) {
                  this.selectedPlayerMap[formKey] = player;
                  localStorage.setItem(formKey, player.id);
                }
              }
            }
          }
        );
      }
    );

    this.poolIsOpen$.subscribe((isOpen) => {
      if (isOpen) {
        this.lineupForm.disable();
      }
    });

    this.lineupForm.updateValueAndValidity();
  }

  async submitLineup() {
    this.lineupError = null;
    this.submittingLineup = true;

    if (this.selectedPlayerIds.length !== uniq(this.selectedPlayerIds).length) {
      alert('You cannot select the same player for multiple slots');
      this.submittingLineup = false;
      return;
    }

    try {
      if (!this.authUserEntry) {
        // check if an entry w/ email already exists and prompt user to login in order to edit
        const existingEntry = await this.firestore
          .collection('entries', (ref) =>
            ref.where(
              'email',
              '==',
              this.lineupForm.value.formEmail.toLowerCase()
            )
          )
          .valueChanges()
          .pipe(first())
          .toPromise();

        if (existingEntry && existingEntry.length > 0) {
          this.lineupError =
            'An entry with this email already exists. Please request a sign-in link from the side-menu in order to edit your entry.';
          this.submittingLineup = false;
          return;
        }
      }

      const filter = new Filter();

      const updateLineup = firebase.functions().httpsCallable('updateLineup');
      const dataToWrite = {
        teamName: filter.clean(this.lineupForm.value.teamName).trim(),
        venmo: this.lineupForm.value.venmoHandle,
        playerIds: this.selectedPlayerIds,
        formValues: this.lineupForm.value,
      };

      if (this.authUserEntry) {
        dataToWrite['entryId'] = this.authUserEntry.id;
      } else {
        dataToWrite['email'] = this.lineupForm.value.formEmail
          .toLowerCase()
          .trim();
      }

      await updateLineup(dataToWrite);
      localStorage.clear();

      if (!this.authUserEntry) {
        await this.authService.sendPasswordlessSignInLink(
          this.lineupForm.value.formEmail
        );
        setTimeout(() => {
          this.snackbar.open(
            'Lineup submitted, check your email for a sign-in link to view/edit',
            'Close',
            {
              horizontalPosition: 'start',
              verticalPosition: 'bottom',
            }
          );
        }, 2500);
      } else {
        this.snackbar.open('Lineup submitted.', 'Close', {
          horizontalPosition: 'start',
          verticalPosition: 'bottom',
        });
      }

      this.router.navigate(['/']);
      this.submittingLineup = false;
    } catch (error) {
      console.error(error);
      this.lineupError =
        'Something went wrong. I probably messed something up. Hit me up please';
      this.submittingLineup = false;
    }
  }
}
