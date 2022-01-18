import { Component, OnInit } from '@angular/core';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { take } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-player-selections',
  templateUrl: './player-selections.component.html',
  styleUrls: ['./player-selections.component.scss']
})
export class PlayerSelectionsComponent implements OnInit {
  public opened: boolean;
  public positions = ['QB', 'RB', 'WR', 'TE', 'K'];
  public barCharts = [];

  // bar
  public barChartType: ChartType = 'bar';
  public barChartPlugins = [ DataLabelsPlugin ];



  constructor(
    private firestore: AngularFirestore
  ) { }

  async ngOnInit(): Promise<void> {
    const entries = (await this.firestore.collection<any>('entries').get().pipe(take(1)).toPromise()).docs.map(doc => doc.data());
    const entryPlayers = _.flatten(entries.map(entry => entry.players));
    const playerGroups = _.groupBy((await this.firestore.collection<any>('players').get().pipe(take(1)).toPromise()).docs.map(doc => doc.data()).filter((player) => {
      return entryPlayers.find(playerId => playerId === player.id);
    }), 'pos');

    const playerCounts = _.countBy(entryPlayers);

    const charts = [];
    _.forEach(playerGroups, (players, pos) => {
      if (pos !== '') {
        const posLabels = [];
        const posData = [];

        const playersWithCounts = _.orderBy(players.map((player) => {
          player.count = playerCounts[player.id];
          return player;
        }), 'count', 'desc');

        playersWithCounts.forEach((player) => {
          posLabels.push(player.name);
          posData.push(player.count);
        });

        charts.push({
          pos: pos,
          options: this.generateBarChartOptions(),
          data: this.generateBarChartData(posLabels, posData, pos)
        });
      }
    });

    this.barCharts = _.orderBy(charts, (chart) => {
      return this.positions.indexOf(chart.pos);
    });
  }

  generateBarChartOptions() {
    const barChartOptions: ChartConfiguration['options'] = {
      responsive: true,

      // We use these empty structures as placeholders for dynamic theming.
      scales: {
        x: {
          ticks: {
            color: '#FFFFFF'
          }
        },
        y: {
          ticks: {
            color: '#FFFFFF',
            autoSkip: false,
          }
        },

      },
      indexAxis: 'y',
      plugins: {
        legend: {
          display: true,
        },
        datalabels: {
          anchor: 'start',
          align: 'end',
          color: '#FFFFFF'
        },

      }
    };

    return barChartOptions;
  }

  generateBarChartData(labels, data, pos) {
    const barChartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [
        { data, label: pos },
      ],
    };
    return barChartData
  }
}


  // Pie
  // public pieChartType: ChartType = 'pie';
  // public pieChartPlugins = [ DatalabelsPlugin ];
  // public pieChartOptions: ChartConfiguration['options'] = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       display: true,
  //       position: 'bottom',
  //     },
  //     datalabels: {
  //       formatter: (value, ctx) => {
  //         if (ctx.chart.data.labels) {
  //           return ctx.chart.data.labels[ctx.dataIndex];
  //         }
  //       },
  //       color: '#FFFFFF'
  //     },
  //   }
  // };
  // public pieChartData: ChartData<'pie', number[], string | string[]>;
  //  = {
  //   labels: [ [ 'Download', 'Sales' ], [ 'In', 'Store', 'Sales' ], 'Mail Sales' ],
  //   datasets: [ {
  //     data: [ 300, 500, 100 ],

  //   } ],
  // };


  // generatePieChartOptions() {
  //   const options: ChartConfiguration['options'] = {
  //     responsive: true,
  //     plugins: {
  //       legend: {
  //         display: true,
  //         position: 'bottom',
  //       },
  //       datalabels: {
  //         formatter: (value, ctx) => {
  //           if (ctx.chart.data.labels) {
  //             return ctx.chart.data.labels[ctx.dataIndex];
  //           }
  //         },
  //         color: '#FFFFFF'
  //       },
  //     }
  //   };

  //   return options;
  // }

  // generatePieChartData(labels, data) {
  //   const chartData: ChartData<'pie', number[], string | string[]> = {
  //    labels: labels,
  //    datasets: [ {
  //      data: data,
  //    } ]
  //  };

  //  return chartData;
  // }
