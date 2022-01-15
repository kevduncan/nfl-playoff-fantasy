import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  public lineupOrder = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    K: 5
  };


  stats$: Observable<any[]>;
  teams$: Observable<any[]>;
  players$: Observable<any[]>;
  entries$: Observable<any[]>;
  scoreboardData$: Observable<unknown>;
  scoring: any;


  constructor(
    private firestore: AngularFirestore
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.scoring = await this.firestore.doc('scoring/points').valueChanges().pipe(take(1)).toPromise();

    this.stats$ = this.firestore.collection('stats').valueChanges();
    this.teams$ = this.firestore.collection('teams').valueChanges();
    this.players$ = this.firestore.collection('players').valueChanges();
    this.entries$ = this.firestore.collection('entries').valueChanges();

    this.scoreboardData$ = combineLatest([this.stats$, this.teams$, this.players$, this.entries$]).pipe(
     map(([stats, teams, allPlayers, entries]) => {
       console.log(stats, teams, allPlayers, entries);

      const playersWithScores = allPlayers.map((player) => {
        let playerPoints = 0;
        const playerStats = stats.filter(stat => stat.playerId === player.id);

        playerStats.forEach((stat) => {
          Object.keys(stat.statLine).forEach((key) => {
            const statAmount = stat.statLine[key] || 0;
            const statScoring = this.scoring[key] || 0;
            console.log(statAmount, statScoring);

            playerPoints += (statAmount * statScoring);
          });
        });
        return {...player, points: playerPoints};
      });


      const entriesWithRosters = entries.map((entry) => {
        let totalPoints = 0;
        let remainingPlayers = 0;

        const isValid = entry.players.length === _.uniq(entry.players).length;

        const roster = playersWithScores.filter(player => entry.players.some(id => id === player.id)).map((player) => {
          const playerTeam = teams.find(team => team.abbr === player.team);

          return {
            ...player,
            teamLogo: playerTeam ? playerTeam.logoUrl : '',
            eliminated: playerTeam ? playerTeam.eliminated : false
          }
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
          roster: sorted,
          totalPoints,
          remainingPlayers,
          isValid
        }
      });

       return _.orderBy(entriesWithRosters.filter(entry => entry.isValid), 'totalPoints', 'desc');
     }),
    );

  }

}
