import json
with open('src/frontend/src/data/master_workshops.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for ws in data:
    if ws.get('year') == 2020 or ws.get('year') == 2022:
        print(str(ws.get('year')) + ': ' + str(len(ws.get('events', []))))
        for i, g in enumerate(ws.get('events', [])):
            print('  Group ' + str(i) + ': ' + str(g.get('date')) + ' ' + str(g.get('title')))
