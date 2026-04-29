import json
with open('src/frontend/src/data/master_workshops.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for i in range(len(data)):
    print(str(i) + ': year=' + str(data[i].get('year')) + ' events=' + str(len(data[i].get('events', []))) + ' type=' + str(type(data[i].get('year'))))
