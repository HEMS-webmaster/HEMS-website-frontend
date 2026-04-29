import json
with open('src/frontend/src/data/master_workshops.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for i in range(len(data)):
    print(str(i) + ': number=' + str(data[i].get('number')) + ' year=' + str(data[i].get('year')))
