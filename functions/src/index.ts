/* eslint-disable quote-props */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
/* eslint-disable comma-dangle */
/* eslint-disable max-len, quotes */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as _ from 'lodash';
import * as axios from 'axios';
import { HttpsError } from 'firebase-functions/v1/auth';

admin.initializeApp();

// update stats via post command
export const updateStats = functions.https.onRequest(
  async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    const firestore = admin.firestore();
    const scrapedStats = request.body;

    // TODO: if empty request body (so no stats), return without reading from DB, saves $ from DB writes

    const existingStats = (await firestore.collection('stats').get()).docs.map(
      (doc: any) => doc.data()
    );
    const entries = (await firestore.collection('entries').get()).docs.map(
      (doc: any) => doc.data()
    );
    const entryPlayers = _.uniq(
      _.flatten(entries.map((entry: any) => entry.players))
    );
    const players = (await firestore.collection('players').get()).docs.map(
      (doc: any) => doc.data()
    );

    const playersNormalizedNames = players
      .filter((player) => {
        return entryPlayers.some((id: string) => id === player.id);
      })
      .map((player) => {
        const name = player.name.split(' (')[0];
        player.name = name;
        return player;
      });

    const noMatchPlayers: any[] = [];
    const formattedStats: any[] = [];
    _.forEach(_.groupBy(scrapedStats, 'name'), (stats, playerName) => {
      // stats is array of each object
      const matchingPlayer = playersNormalizedNames.find(
        (player: any) => player.name.toUpperCase() === playerName.toUpperCase()
      );

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
        poolYear: new Date().getFullYear(),
      };
    });

    functions.logger.log(noMatchPlayers);

    // if player+opp stat exists then use existing id, otherwise generate new id, map id to object
    const statsWithIds = statsToWrite.map((playerStats) => {
      const matchingStat = existingStats.find(
        (stat) =>
          `${stat.playerId}${stat.opponent}` ===
          `${playerStats.playerId}${playerStats.opponent}`
      );

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
  }
);

/**
 *
 * @param {{any}} stats
 * @return {{any}}
 */
function generateStatLine(stats: any[]) {
  const statLine = {
    passingYds: 0,
    rushYds: 0,
    missedFg: 0,
    passingTds: 0,
    '2pc': 0,
    pat: 0,
    int: 0,
    rec: 0,
    fg60: 0,
    fum: 0,
    rushTds: 0,
    'fg0-39': 0,
    'fg50-59': 0,
    'fg40-49': 0,
    recYds: 0,
    recTds: 0,
    miscTds: 0,
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

export const seedTeamsAndPlayers = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    const firestore = admin.firestore();

    const teamIds = Array.from({ length: 34 }, (_, i) => i + 1);
    const endpoint = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{TEAM_ID}?enable=roster`;

    const teams = [];
    const players = [];

    const allFantasyPlayers = await axios.default.get(
      'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/0/leaguedefaults/3?view=kona_player_info',
      {
        headers: {
          'X-Fantasy-Filter':
            '{"players":{"limit":2000,"sortPercOwned":{"sortPriority":4,"sortAsc":false}}}',
        },
      }
    );

    for (const id of teamIds) {
      const teamEndpoint = endpoint.replace('{TEAM_ID}', id.toString());
      const teamResponse = await axios.default.get(teamEndpoint);
      const teamInfo = teamResponse.data?.team;

      if (!teamInfo.isActive) continue;

      const playoffSeed =
        teamInfo.record.items
          ?.find((item: any) => item.type === 'total')
          ?.stats?.find((stat: any) => stat.name === 'playoffSeed')?.value ||
        999;

      const dbTeam = {
        id: teamInfo.id,
        abbr: teamInfo.abbreviation,
        name: teamInfo.displayName,
        logoUrl: teamInfo.logos[0].href,
        madePlayoffs: playoffSeed && playoffSeed <= 7,
        eliminated: !playoffSeed || playoffSeed > 7,
        color: `#${teamInfo.color}`,
        alternateColor: `#${teamInfo.alternateColor}`,
      };

      teams.push(dbTeam);

      if (dbTeam.madePlayoffs) {
        const playersInfo = teamInfo.athletes.filter(
          (player: any) =>
            ['QB', 'RB', 'WR', 'TE'].includes(player.position.abbreviation) &&
            player.status.id == 1
        );

        for (const player of playersInfo) {
          const fantasyData = allFantasyPlayers.data.players?.find(
            (p: any) => p?.player?.id?.toString() === player?.id?.toString()
          );
          const dbPlayer = {
            id: player.id,
            name: player.displayName,
            team: dbTeam.abbr,
            pos: player.position.abbreviation,
            headShot: player.headshot.href,
            injuryStatus: player.injuries[0]?.type.abbreviation || '',
            fantasyPositionRank:
              Number(fantasyData?.ratings[0]?.positionalRanking) || 999,
            fantasyPprPoints: Number(fantasyData?.ratings[0]?.totalRating) || 0,
          };

          players.push(dbPlayer);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const teamBatch = firestore.batch();
    teams.forEach((team) => {
      const docRef = firestore.doc(`teams/${team.abbr}`);
      teamBatch.set(docRef, team);
    });
    await teamBatch.commit();

    const playersBatch = firestore.batch();
    players.forEach((player) => {
      const docRef = firestore.doc(`players/${player.id}`);
      playersBatch.set(docRef, player);
    });
    await playersBatch.commit();

    res.send({ teams, players });
  });

export const updateLineup = functions.https.onCall(async (data, context) => {
  const firestore = admin.firestore();

  const { playerIds, teamName, venmo, email, formValues, entryId } = data;
  console.log(entryId);

  delete formValues.teamName;
  delete formValues.venmoHandle;
  delete formValues.formEmail;

  if (playerIds.length !== _.uniq(playerIds).length) {
    console.error('Duplicate player selected');
    throw new HttpsError('cancelled', 'Duplicate player selected;');
  }

  const id = entryId ? entryId : firestore.collection('entries').doc().id;
  const entry: any = {
    id,
    teamName,
    venmo,
    players: playerIds,
    poolYear: new Date().getFullYear(),
    lastUpdated: admin.firestore.Timestamp.now(),
    formValues,
    _paid: false,
  };

  if (!entryId) {
    entry['email'] = email;
  }

  await firestore.doc(`entries/${id}`).set(entry, { merge: true });
  return 'Ok';
});
