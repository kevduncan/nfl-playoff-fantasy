import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as _ from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-stat-entry',
  templateUrl: './stat-entry.component.html',
  styleUrls: ['./stat-entry.component.scss']
})
export class StatEntryComponent implements OnInit {
  entries$: Observable<any[]>;
  teams$: Observable<any[]>;
  aliveTeams$: Observable<any[]>;
  players$: Observable<any[]>;
  stats$: Observable<any[]>;
  selectedPlayers$: Observable<any[]>;
  existingStats$: Observable<any[]>;

  newStatPlayer: any;
  newStatOpponent: any;

  scoring: any;
  scoringKeys: string[];
  scoringModel = {};

  playerTeam$: BehaviorSubject<any> = new BehaviorSubject(null);

  statsSorter = ['passingYds', 'passingTds', 'int', 'rushYds', 'rushTds', 'fum', 'rec', 'recYds', 'recTds', 'miscTds', '2pc', 'pat', 'missedFg', 'fg0-39', 'fg40-49', 'fg50-59', 'fg60'];

  constructor(
    private firestore: AngularFirestore,
  ) { }

  async ngOnInit(): Promise<void> {
    this.scoring = await this.firestore.doc('scoring/points').valueChanges().pipe(take(1)).toPromise();
    this.scoringKeys = _.orderBy(Object.keys(this.scoring), key => this.statsSorter.indexOf(key));
    this.scoringKeys.forEach((key) => {
      this.scoringModel[key] = 0;
    });

    this.entries$ = this.firestore.collection('entries').valueChanges();
    this.teams$ = this.firestore.collection('teams').valueChanges();
    this.players$ = this.firestore.collection('players').valueChanges();
    this.stats$ = this.firestore.collection('stats').valueChanges();

    this.aliveTeams$ = this.teams$.pipe(map(teams => teams.filter(team => !team.eliminated)));

    this.selectedPlayers$ = combineLatest([this.playerTeam$, this.entries$, this.teams$, this.players$]).pipe(
      map(([playerTeam, entries, teams, players]) => {
        const entryPlayers = _.uniq(_.flatten(entries.map(entry => entry.players)));

        return _.orderBy(entryPlayers.map((playerId) => {
          return players.find(player => player.id === playerId);
        }).filter((player) => {
          const playerTeamObj = teams.find(team => team.abbr == player.team);
          return playerTeamObj ? !playerTeamObj.eliminated && playerTeam === playerTeamObj.abbr : false;
        }), 'name', 'asc');
      })
    );

    this.existingStats$ = combineLatest([this.stats$, this.players$]).pipe(
      map(([stats, players]) => {
        return _.orderBy(stats.map((stat) => {
          const matchingPlayer = players.find(player => player.id === stat.playerId);
          return {
            ...stat,
            playerName: matchingPlayer.name
          }
        }), 'timestamp', 'desc');
      })
    )
  }

  async submitNewStat() {
    const id = this.firestore.collection('stats').doc().ref.id;

    await this.firestore.collection('stats').add({
      id,
      playerId: this.newStatPlayer.id,
      opponent: this.newStatOpponent.abbr,
      statLine: this.scoringModel,
      timestamp: Date.now()
    });

    this.scoringKeys.forEach((key) => {
      this.scoringModel[key] = 0;
    });

    this.newStatPlayer = null;

    console.log(id);
  }

  setSelectedTeam(e) {
    if (e.isUserInput) {
      this.playerTeam$.next(e.source.value.abbr);
    }
  }

  async editExistingStat(stat) {
    await this.firestore.doc(`stats/${stat.id}`).update({statLine: stat.statLine, timestamp: Date.now()});
  }
}
