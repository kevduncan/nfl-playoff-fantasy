from urllib.request import urlopen
import json
import requests

def scrape_box_scores(request):
    gameids = ['401547378']
    stats = []
    for id in gameids:
        url_event = "http://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=" + id
        NFL_event = urlopen(url_event)
        box_score = json.loads(NFL_event.read())['boxscore']
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
                        'statName': stat['name'],
                        'id': athlete['athlete']['id']
                    }
                    for i in range(len(athlete['stats'])):
                        playerStats[statLabels[i]] = athlete['stats'][i]
                    stats.append(playerStats)

    requests.post('https://us-central1-nfl-fantasy-playoffs-9af36.cloudfunctions.net/updateStats',json=stats)
    return "done"

    # """Responds to any HTTP request.
    # Args:
    #     request (flask.Request): HTTP request object.
    # Returns:
    #     The response text or any set of values that can be turned into a
    #     Response object using
    #     `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    # """
    # request_json = request.get_json()
    # if request.args and 'message' in request.args:
    #     return request.args.get('message')
    # elif request_json and 'message' in request_json:
    #     return request_json['message']
    # else:
    #     return f'Hello World!'
