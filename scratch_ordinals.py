import json
with open('src/frontend/src/data/master_workshops.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for i, ws in enumerate(data):
    print(str(i) + ': ' + str(ws.get('ordinal')) + ' ' + str(ws.get('year')) + ' (events length: ' + str(len(ws.get('events', []))) + ')')
