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
  public positions = ['QB', 'RB', 'WR', 'TE', 'K'];
  public barCharts = [];

  // bar
  public barChartType: ChartType = 'bar';
  public barChartPlugins = [ DataLabelsPlugin ];

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

    _.forEach(playerGroups, (players, pos) => {
      if (pos !== '') {
        const posLabels = [];
        const posData = [];
        players.forEach((player) => {
          const count = playerCounts[player.id];
          posLabels.push(player.name);
          posData.push(count);
        });
        // groupSets.push({[pos]: {posLabels, posData}});
        this.barCharts.push({
          pos: pos,
          options: this.generateBarChartOptions(),
          data: this.generateBarChartData(posLabels, posData, pos)
        });
      }
    });
  }

  generateBarChartOptions() {
    const barChartOptions: ChartConfiguration['options'] = {
      responsive: true,
      // We use these empty structures as placeholders for dynamic theming.
      scales: {
        x: {},
        y: {}
      },
      indexAxis: 'y',
      plugins: {
        legend: {
          display: true,
        },
        datalabels: {
          anchor: 'end',
          align: 'end'
        }
      }
    };

    return barChartOptions;
  }

  generateBarChartData(labels, data, pos) {
    const barChartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [
        { data, label: pos },
      ]
    };
    return barChartData
  }

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


}


/**
 * [
 *  {
 *    pos: '',
 *    options: {},
 *    data: {}
 *  }
 * ]
 */
