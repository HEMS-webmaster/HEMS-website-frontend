import json
with open('src/frontend/src/data/master_workshops.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for ws in data:
    print(str(ws.get('ordinal')) + ' Workshop (' + str(ws.get('year')) + ') - events: ' + str(len(ws.get('events', []))))
