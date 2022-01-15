import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-stat-entry',
  templateUrl: './stat-entry.component.html',
  styleUrls: ['./stat-entry.component.scss']
})
export class StatEntryComponent implements OnInit {
  entries$: Observable<any[]>;
  teams$: Observable<any[]>;
  players$: Observable<any[]>;
  stats$: Observable<any[]>;
  selectedPlayers$: Observable<any[]>;

  newStatPlayer: any;
  scoring: any;
  scoringKeys: string[];
  scoringModel = {};

  constructor(
    private firestore: AngularFirestore,
  ) { }

  async ngOnInit(): Promise<void> {
    this.scoring = await this.firestore.doc('scoring/points').valueChanges().pipe(take(1)).toPromise();
    this.scoringKeys = Object.keys(this.scoring).sort();
    this.scoringKeys.forEach((key) => {
      this.scoringModel[key] = 0;
    });

    this.entries$ = this.firestore.collection('entries').valueChanges();
    this.teams$ = this.firestore.collection('teams').valueChanges();
    this.players$ = this.firestore.collection('players').valueChanges();
    this.stats$ = this.firestore.collection('stats').valueChanges();

    this.selectedPlayers$ = combineLatest([this.entries$, this.teams$, this.players$]).pipe(
      map(([entries, teams, players]) => {
        const entryPlayers = _.uniq(_.flatten(entries.map(entry => entry.players)));

        return entryPlayers.map((playerId) => {
          return players.find(player => player.id === playerId);
        }).filter((player) => {
          const playerTeam = teams.find(team => team.abbr == player.team);
          return playerTeam ? !playerTeam.eliminated : false;
        })
      })
    );
  }

}
