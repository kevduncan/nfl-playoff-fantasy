/* eslint-disable max-len, quotes */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as _ from 'lodash';

admin.initializeApp();

// update stats via post command
export const updateStats = functions.https.onRequest(async (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");

  const firestore = admin.firestore();
  const scrapedStats = request.body;

  // TODO: if empty request body (so no stats), return without reading from DB, saves $ from DB writes


  const existingStats = (await firestore.collection("stats").get()).docs.map((doc: any) => doc.data());
  const entries = (await firestore.collection("entries").get()).docs.map((doc: any) => doc.data());
  const entryPlayers = _.uniq(_.flatten(entries.map((entry: any) => entry.players)));
  const players = (await firestore.collection("players").get()).docs.map((doc: any) => doc.data());

  const playersNormalizedNames = players.filter((player) => {
    return entryPlayers.some((id: string) => id === player.id);
  }).map((player) => {
    const name = player.name.split(' (')[0];
    player.name = name;
    return player;
  });

  const noMatchPlayers: any[] = [];
  const formattedStats: any[] = [];
  _.forEach(_.groupBy(scrapedStats, 'name'), (stats, playerName) => {
    // stats is array of each object
    const matchingPlayer = playersNormalizedNames.find((player: any) => player.name.toUpperCase() === playerName.toUpperCase());

    if (!matchingPlayer) {
      noMatchPlayers.push(playerName);
    } else {
      formattedStats.push({
        playerId: matchingPlayer.id,
        team: matchingPlayer.team,
        opp: stats[0] ? stats[0].opp : '',
        stats: stats.map((stat) => {
          delete stat.name;
          delete stat.team;
          delete stat.opp;
          return stat;
        }),
      });
    }
  });

  const statsToWrite = formattedStats.map((playerAndStats) => {
    const statLine = generateStatLine(playerAndStats.stats);
    return {
      playerId: playerAndStats.playerId,
      opponent: playerAndStats.opp,
      id: '',
      timestamp: 0,
      statLine,
    };
  });

  functions.logger.log(noMatchPlayers);

  // if player+opp stat exists then use existing id, otherwise generate new id, map id to object
  const statsWithIds = statsToWrite.map((playerStats) => {
    const matchingStat = existingStats.find((stat) => `${stat.playerId}${stat.opponent}` === `${playerStats.playerId}${playerStats.opponent}`);

    if (matchingStat) {
      playerStats.id = matchingStat.id;
      playerStats.statLine['2pc'] = matchingStat.statLine['2pc'];
      playerStats.statLine['missedFg'] = matchingStat.statLine['missedFg'];
      playerStats.statLine['fg60'] = matchingStat.statLine['fg60'];
      playerStats.statLine['fg50-59'] = matchingStat.statLine['fg50-59'];
      playerStats.statLine['fg40-49'] = matchingStat.statLine['fg40-49'];
      playerStats.statLine['fg0-39'] = matchingStat.statLine['fg0-39'];
    } else {
      playerStats.id = firestore.collection('stats').doc().id;
    }

    playerStats.timestamp = Date.now();

    return playerStats;
  });

  functions.logger.log(JSON.stringify(statsWithIds));

  const batch = firestore.batch();

  statsWithIds.forEach((stat) => {
    const docRef = firestore.doc(`stats/${stat.id}`);
    batch.set(docRef, stat);
  });

  await batch.commit();

  response.end();
});

/**
 *
 * @param {{any}} stats
 * @return {{any}}
 */
function generateStatLine(stats: any[]) {
  const statLine = {
    'passingYds': 0,
    'rushYds': 0,
    'missedFg': 0,
    'passingTds': 0,
    '2pc': 0,
    'pat': 0,
    'int': 0,
    'rec': 0,
    'fg60': 0,
    'fum': 0,
    'rushTds': 0,
    'fg0-39': 0,
    'fg50-59': 0,
    'fg40-49': 0,
    'recYds': 0,
    'recTds': 0,
    'miscTds': 0,
  };

  stats.forEach((stat: any) => {
    switch (stat.statName) {
      case 'passing':
        statLine.passingYds = parseInt(stat.YDS);
        statLine.passingTds = parseInt(stat.TD);
        statLine.int = parseInt(stat.INT);
        break;
      case 'rushing':
        statLine.rushYds = parseInt(stat.YDS);
        statLine.rushTds = parseInt(stat.TD);
        break;
      case 'receiving':
        statLine.rec = parseInt(stat.REC);
        statLine.recYds = parseInt(stat.YDS);
        statLine.recTds = parseInt(stat.TD);
        break;
      case 'fumbles':
        statLine.fum = parseInt(stat.LOST);
        break;
      case 'kickReturns':
        statLine.miscTds += parseInt(stat.TD);
        break;
      case 'puntReturns':
        statLine.miscTds += parseInt(stat.TD);
        break;
      default:
        break;
    }
  });

  return statLine;
}
