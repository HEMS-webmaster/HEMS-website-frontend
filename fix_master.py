import json
import os
from urllib.parse import urlparse

with open('src/frontend/src/data/archives/2015.json', 'r') as f:
    archive_data = json.load(f)

master_path = 'src/frontend/src/data/master_workshops.json'
with open(master_path, 'r') as f:
    master_data = json.load(f)

sponsors_list = []
for s in archive_data.get("sponsors", []):
    logo = ""
    if s.get("image"):
        logo = os.path.basename(s["image"].split("?")[0])
    sponsors_list.append({
        "company": s.get("name", ""),
        "year": s.get("year", ""),
        "link": s.get("url", ""),
        "logo_file": logo
    })

students_list = []
for day_block in archive_data.get("schedule", []):
    for item in day_block.get("items", []):
        if item.get("type") == "session":
            for talk in item.get("talks", []):
                if "Student Award Winner" in talk.get("title", ""):
                    for author in talk.get("authors", []):
                        inst = ""
                        if talk.get("institutes"):
                            inst = talk["institutes"][0].get("name", "")
                        
                        p_file = ""
                        if talk.get("local_target_path"):
                            p_file = os.path.basename(urlparse(talk["local_target_path"]).query.split("=")[-1])
                        a_file = ""
                        if talk.get("local_abstract_target_path"):
                            a_file = os.path.basename(urlparse(talk["local_abstract_target_path"]).query.split("=")[-1])

                        students_list.append({
                            "name": author.get("name", ""),
                            "institute": inst,
                            "url": talk.get("legacy_url", ""),
                            "presentation_file": p_file,
                            "abstract_url": talk.get("legacy_abstract_url", ""),
                            "abstract_file": a_file
                        })

for i, w in enumerate(master_data):
    if w["year"] == "2015":
        master_data[i]["sponsors"] = sponsors_list
        master_data[i]["student_awards"] = students_list
        break

with open(master_path, 'w') as f:
    json.dump(master_data, f, indent=2)

print("Fixed master_workshops.json for 2015!")
