import json

master_file = 'src/frontend/src/data/master_workshops.json'
archive_file = 'src/frontend/src/data/archives/2022.json'

# 1. Load Master Workshops
with open(master_file, 'r', encoding='utf-8') as f:
    master_data = json.load(f)

# Find 14th workshop
ws_14 = None
for ws in master_data:
    if ws.get('number') == 14:
        ws_14 = ws
        break

if not ws_14:
    print('14th Workshop not found!')
    exit(1)

# Get events from 14th workshop
current_events = ws_14.get('events', [])
print(f'Current 14th workshop events length: {len(current_events)}')

# If there are more than 2, trim it to the first 24hrs (first 2 groups) that the user manually entered.
if len(current_events) >= 2:
    current_events = current_events[:2]

# 2. Append Day 2 and Day 3
rest_of_events = [
  {
    'date': '2022-09-28',
    'title': 'HEMS Workshop Day 2',
    'events': [
      {
        'time': '07:45',
        'end_time': '',
        'title': 'Breakfast',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Lobby',
        'location_url': ''
      },
      {
        'time': '10:00',
        'end_time': '',
        'title': 'Mid-morning Break',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Lobby',
        'location_url': ''
      },
      {
        'time': '12:00',
        'end_time': '',
        'title': 'Lunch',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Lobby',
        'location_url': ''
      },
      {
        'time': '15:00',
        'end_time': '',
        'title': 'Mid-Afternoon Break',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Lobby',
        'location_url': ''
      },
      {
        'time': '18:00',
        'end_time': '',
        'title': 'Dinner on your own',
        'subtitle': '',
        'subtitle_url': '',
        'location': '',
        'location_url': ''
      }
    ]
  },
  {
    'date': '2022-09-29',
    'title': 'HEMS Workshop Day 3',
    'events': [
      {
        'time': '07:30',
        'end_time': '',
        'title': 'Breakfast',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Lobby',
        'location_url': ''
      },
      {
        'time': '10:00',
        'end_time': '',
        'title': 'Mid-morning Break',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Lobby',
        'location_url': ''
      },
      {
        'time': '11:30',
        'end_time': '',
        'title': 'Closing Remarks',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Mercury Room',
        'location_url': ''
      },
      {
        'time': '12:00',
        'end_time': '',
        'title': 'Workshop Ends',
        'subtitle': '',
        'subtitle_url': '',
        'location': 'Mercury Room',
        'location_url': ''
      }
    ]
  }
]

current_events.extend(rest_of_events)

# Update master
ws_14['events'] = current_events
with open(master_file, 'w', encoding='utf-8') as f:
    json.dump(master_data, f, indent=2)

# 3. Load 2022 archive and update it
with open(archive_file, 'r', encoding='utf-8') as f:
    archive_data = json.load(f)

archive_data['events'] = current_events
with open(archive_file, 'w', encoding='utf-8') as f:
    json.dump(archive_data, f, indent=2)

print('Successfully injected Day 2 and Day 3 into 14th Workshop (master_workshops.json and 2022.json)')
