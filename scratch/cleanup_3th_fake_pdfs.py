import os
import json

master_path = r"c:\Antigravity\HEMS-website\src\frontend\src\data\master_workshops.json"
base_dir = r"c:\Antigravity\HEMS-website"

if not os.path.exists(master_path):
    print(f"Error: master_workshops.json not found at {master_path}")
    exit(1)

with open(master_path, 'r', encoding='utf-8') as f:
    workshops = json.load(f)

def is_fake_pdf(rel_path):
    if not rel_path:
        return False
    proceedings_dir = os.path.join(base_dir, "docs", "archives_translation", "proceedings", "3th")
    for root, dirs, files in os.walk(proceedings_dir):
        for file in files:
            if file.lower() == rel_path.lower():
                full_p = os.path.join(root, file)
                try:
                    with open(full_p, 'rb') as f:
                        header = f.read(4)
                    if header.startswith(b'<HTM') or header.startswith(b'<htm') or header.startswith(b' \n<h') or header.startswith(b'<!DO') or header == b'PK\x03\x04':
                        return full_p
                except:
                    pass
    return False

fake_files_deleted = []

# Modify workshops data to clean up the FAKE PDF references
for ws in workshops:
    if ws.get('number') == 3:
        # Check sessions
        if 'presentation_sessions' in ws and isinstance(ws['presentation_sessions'], list):
            for session in ws['presentation_sessions']:
                for talk in session.get('presentations', []):
                    # Check presentation_file
                    p_file = talk.get('presentation_file')
                    p_fake_p = is_fake_pdf(p_file)
                    if p_fake_p:
                        print(f"Talk '{talk.get('title')[:30]}...' -> presentation_file '{p_file}' is FAKE. Removing reference.")
                        talk['presentation_file'] = ""
                        if p_fake_p not in fake_files_deleted:
                            fake_files_deleted.append(p_fake_p)
                            
                    # Check abstract_file
                    a_file = talk.get('abstract_file')
                    a_fake_p = is_fake_pdf(a_file)
                    if a_fake_p:
                        print(f"Talk '{talk.get('title')[:30]}...' -> abstract_file '{a_file}' is FAKE. Removing reference.")
                        talk['abstract_file'] = ""
                        if a_fake_p not in fake_files_deleted:
                            fake_files_deleted.append(a_fake_p)
                            
        # Check posters
        if 'posters' in ws and isinstance(ws['posters'], list):
            for poster in ws['posters']:
                p_file = poster.get('poster_file')
                p_fake_p = is_fake_pdf(p_file)
                if p_fake_p:
                    print(f"Poster '{poster.get('title')[:30]}...' -> poster_file '{p_file}' is FAKE. Removing reference.")
                    poster['poster_file'] = ""
                    if p_fake_p not in fake_files_deleted:
                        fake_files_deleted.append(p_fake_p)
                        
                a_file = poster.get('abstract_file')
                a_fake_p = is_fake_pdf(a_file)
                if a_fake_p:
                    print(f"Poster '{poster.get('title')[:30]}...' -> abstract_file '{a_file}' is FAKE. Removing reference.")
                    poster['abstract_file'] = ""
                    if a_fake_p not in fake_files_deleted:
                        fake_files_deleted.append(a_fake_p)

# Save updated workshops back to the master JSON file
with open(master_path, 'w', encoding='utf-8') as f:
    json.dump(workshops, f, indent=2, ensure_ascii=False)

print(f"\nSuccessfully updated master database: {master_path}")

# Delete the physical HTML-as-PDF files from the docs proceedings folder
deleted_count = 0
for fp in fake_files_deleted:
    if os.path.exists(fp):
        os.remove(fp)
        print(f"Deleted physical fake PDF: {os.path.basename(fp)}")
        deleted_count += 1

print(f"\nDeleted {deleted_count} physical fake files.")
