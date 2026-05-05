import json
import os
from urllib.parse import urlparse

# Load 2015.json
with open('src/frontend/src/data/archives/2015.json', 'r') as f:
    archive_data = json.load(f)

# Load master_workshops.json
master_path = 'src/frontend/src/data/master_workshops.json'
with open(master_path, 'r') as f:
    master_data = json.load(f)

# Build the payload for master
payload = {
    "number": 10,
    "year": "2015",
    "city": "Baltimore, MD",
    "venue": archive_data.get("venue", ""),
    "sponsors": [s["name"] for s in archive_data.get("sponsors", [])],
    "student_awards": [], # Will populate from sessions
    "posters": [],
    "presentation_sessions": []
}

# Traverse schedule to populate sessions
for day_block in archive_data.get("schedule", []):
    date_str = day_block["title"]
    for item in day_block.get("items", []):
        if item.get("type") == "session":
            session_out = {
                "date": date_str,
                "title": item["title"],
                "location": item.get("location", ""),
                "presentations": []
            }
            
            for talk in item.get("talks", []):
                # Extract file basenames
                p_file = ""
                if talk.get("local_target_path"):
                    p_file = os.path.basename(urlparse(talk["local_target_path"]).query.split("=")[-1])
                
                a_file = ""
                if talk.get("local_abstract_target_path"):
                    a_file = os.path.basename(urlparse(talk["local_abstract_target_path"]).query.split("=")[-1])

                # Check if it's a student award
                if "Student Award Winner" in talk.get("title", ""):
                    payload["student_awards"].extend([a["name"] for a in talk.get("authors", [])])

                presentation = {
                    "time": talk.get("time", ""),
                    "title": talk.get("title", ""),
                    "authors": [
                        {
                            "name": a.get("name", ""),
                            "isPresenter": a.get("isPresenter", False),
                            "affiliation": "" # Default empty, could fetch from institutes if needed
                        } for a in talk.get("authors", [])
                    ],
                    "presentation_file": p_file,
                    "abstract_file": a_file,
                    "url": talk.get("legacy_url", ""),
                    "abstract_url": talk.get("legacy_abstract_url", "")
                }
                session_out["presentations"].append(presentation)
            
            payload["presentation_sessions"].append(session_out)

# Update the master_workshops.json
for i, w in enumerate(master_data):
    if w["year"] == "2015":
        master_data[i] = payload
        break

with open(master_path, 'w') as f:
    json.dump(master_data, f, indent=2)

print("Updated master_workshops.json for 2015!")
