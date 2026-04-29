import json
with open('src/frontend/src/data/master_workshops.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print('Index 12:', data[12].get('title'), data[12].get('year'), 'Ordinal:', data[12].get('ordinal'))
print('Index 13:', data[13].get('title'), data[13].get('year'), 'Ordinal:', data[13].get('ordinal'))
