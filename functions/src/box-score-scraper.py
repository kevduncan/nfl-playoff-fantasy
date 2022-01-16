# separate cloud function since firebase functions does not support pytthon

import espn_scraper as espn
import requests

def scrape_box_scores(request):
    gameids = ['401326630', '401326629', '401326628', '401326625']

    stats = []
    for id in gameids:
        box_score = espn.get_url('https://www.espn.com/nfl/boxscore?gameId=' + id + '&xhr=1')['gamepackageJSON']['boxscore']
        teamAbbrs = [team['team']['abbreviation'] for team in box_score['teams']]

        # stats only exist once game starts, exit before then
        if 'players' not in box_score:
            break

        for teamPlayers in box_score['players']:
            team = teamPlayers['team']['abbreviation']
            for stat in teamPlayers['statistics']:
                if stat['name'] not in ['passing', 'rushing', 'receiving', 'fumbles', 'kickReturns', 'puntReturns']:
                    continue
                statLabels = stat['labels']
                for athlete in stat['athletes']:
                    playerName = athlete['athlete']['displayName']
                    opponent = teamAbbrs[1] if teamAbbrs.index(team) == 0 else teamAbbrs[0]
                    playerStats = {
                        'name': playerName,
                        'team': team,
                        'opp': opponent,
                        'statName': stat['name']
                    }
                    for i in range(len(athlete['stats'])):
                        playerStats[statLabels[i]] = athlete['stats'][i]
                    stats.append(playerStats)

    requests.post('https://us-central1-nfl-fantasy-playoffs-9af36.cloudfunctions.net/updateStats',json=stats)
    return "done"

