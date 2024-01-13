import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-player-stats-dialog',
  templateUrl: './player-stats-dialog.component.html',
  styleUrls: ['./player-stats-dialog.component.scss']
})
export class PlayerStatsDialogComponent implements OnInit {
  standardScoringCategories = {
    'QB': ['passingYds', 'passingTds', 'rushYds', 'rushTds', 'int', 'fum'],
    'RB': ['rushYds', 'rushTds', 'rec', 'recYds', 'recTds'],
    'WR': ['rec', 'recYds', 'recTds'],
    'TE': ['rec', 'recYds', 'recTds'],
    'K': ['pat', 'fg0-39', 'fg40-49', 'fg50-59', 'fg60', 'missedFg']
  };

  tableHeaders$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  playerGameLog$: Observable<any[]>;

  constructor(
    private firestore: AngularFirestore,
    public dialogRef: MatDialogRef<PlayerStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public player: any
  ) { }

  ngOnInit(): void {
    this.setTableHeaders();

    this.playerGameLog$ = this.firestore.collection<any>('teams').valueChanges().pipe(
      map((teams) => {
        return _.orderBy(this.player.playerStats.map((stats) => {
          const oppTeamLogo = teams.find(team => team.abbr === stats.opponent)?.logoUrl || '';
          return {
            ...stats,
            oppTeamLogo
          }
        }), 'timestamp', 'asc');
      })
    );
  }

  setTableHeaders(): void {
    const headersToShow = ['', ' '];

    this.player.playerStats.forEach((gameStatLine) => {
      Object.keys(gameStatLine.statLine).forEach((key) => {
        const statZero = gameStatLine.statLine[key] === 0;
        const standardCat = this.standardScoringCategories[this.player.pos].indexOf(key) >= 0;
        if (standardCat || !statZero) headersToShow.push(key);
      });
    });

    this.tableHeaders$.next(
      _.orderBy(_.uniq(headersToShow), (key) => {
        switch(key) {
          case '':
            return -2;
          case ' ':
            return -1;
          default:
            const idx = this.standardScoringCategories[this.player.pos].indexOf(key);
            return idx < 0 ? 100 : idx;
        }
      })
    );
  }

}
