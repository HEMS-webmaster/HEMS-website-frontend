import json

events_data = [
    {
        "date": "2002-03-25",
        "title": "Travel Day",
        "events": [
            {"time": "7:00 p.m.", "end_time": "", "title": "Welcome Reception", "subtitle": "", "location": "Courtyard Old Pasadena"}
        ]
    },
    {
        "date": "2002-03-26",
        "title": "Day 2",
        "events": [
            {"time": "8:00 a.m.", "end_time": "", "title": "Continental Breakfast", "subtitle": "", "location": ""},
            {"time": "8:30 a.m.", "end_time": "", "title": "Welcome and Introduction", "subtitle": "Patricia Beauchamp", "location": ""},
            {"time": "10:45 a.m.", "end_time": "", "title": "Break", "subtitle": "", "location": ""},
            {"time": "12:00 p.m.", "end_time": "", "title": "Informal Buffet Lunch", "subtitle": "", "location": ""},
            {"time": "3:30 p.m.", "end_time": "", "title": "Break", "subtitle": "", "location": ""},
            {"time": "6:15 p.m.", "end_time": "", "title": "Evening Free", "subtitle": "", "location": ""}
        ]
    },
    {
        "date": "2002-03-27",
        "title": "Day 3",
        "events": [
            {"time": "8:00 a.m.", "end_time": "", "title": "Continental Breakfast / Vendor Expo", "subtitle": "", "location": ""},
            {"time": "11:00 a.m.", "end_time": "", "title": "Break", "subtitle": "", "location": ""},
            {"time": "12:15 p.m.", "end_time": "", "title": "Informal Buffet Lunch", "subtitle": "", "location": ""},
            {"time": "3:00 p.m.", "end_time": "", "title": "Break", "subtitle": "", "location": ""},
            {"time": "6:15 p.m.", "end_time": "", "title": "Free Time", "subtitle": "", "location": ""},
            {"time": "7:30 p.m.", "end_time": "", "title": "Conference Dinner", "subtitle": "Guest Speaker: Brian Wilcox, Topic: \"Surface, Subsurface, and Atmospheric Exploration of Planets and Small Bodies by Robotic Vehicles over the Next Two Decades\"", "location": "McCormick & Schmick's Seafood Restaurant, 111 N. Los Robles Avenue Pasadena, CA"}
        ]
    },
    {
        "date": "2002-03-28",
        "title": "Pumps Workshop",
        "events": [
            {"time": "8:00 a.m.", "end_time": "", "title": "Continental Breakfast", "subtitle": "", "location": ""},
            {"time": "8:30 a.m.", "end_time": "", "title": "Welcome and Introduction", "subtitle": "Dean Wiberg", "location": ""},
            {"time": "10:15 a.m.", "end_time": "", "title": "Break", "subtitle": "", "location": ""},
            {"time": "12:00 p.m.", "end_time": "", "title": "Informal Lunch Buffet", "subtitle": "", "location": ""},
            {"time": "3:30 p.m.", "end_time": "", "title": "Break", "subtitle": "", "location": ""},
            {"time": "5:15 p.m.", "end_time": "", "title": "Closing Remarks", "subtitle": "Patricia Beauchamp", "location": ""},
            {"time": "5:30 p.m.", "end_time": "", "title": "Adjourn", "subtitle": "", "location": ""}
        ]
    }
]

file_path = 'c:/Antigravity/HEMS-website/src/frontend/src/data/master_workshops.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for w in data:
    if str(w.get('number')) == '3':
        w['events'] = events_data
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Updated events for 3rd workshop.')
