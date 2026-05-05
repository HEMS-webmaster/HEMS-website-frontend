import json

try:
    tm = json.load(open('temp_main.json', encoding='utf-16'))
except: tm = []

try:
    t2 = json.load(open('temp2.json', encoding='utf-16'))
except: t2 = []

for i in range(14):
    ntm = len(str(tm[i])) if i < len(tm) else 0
    nt2 = len(str(t2[i])) if i < len(t2) else 0
    print(f"WS {i+1}: temp_main={ntm} temp2={nt2}")
