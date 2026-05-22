import json
import urllib.request
import re
from urllib.parse import urljoin

file_path = 'c:/Antigravity/HEMS-website/src/frontend/src/data/master_workshops.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

zip_files = []

def extract_direct_link(html, base_url):
    # Find all <a href="...">...</a>
    # Looking for 'Download', 'View', 'presentation', or direct file links.
    matches = re.findall(r'<a\s+[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
    for href, text in matches:
        text_clean = text.lower().replace('\n', ' ').strip()
        if 'download' in text_clean or 'view' in text_clean or href.lower().endswith(('.pdf', '.ppt', '.pptx', '.zip')):
            # Skip mailto or back links
            if href.startswith('mailto:'): continue
            if 'index.htm' in href and 'back' in text_clean: continue
            
            # Prefer links that actually point to files
            if href.lower().endswith(('.pdf', '.ppt', '.pptx', '.zip')):
                return urljoin(base_url, href)
            elif 'download' in text_clean or 'view or download' in text_clean:
                return urljoin(base_url, href)
    
    # fallback to any pdf/ppt/zip if not found yet
    for href, text in matches:
        if href.lower().endswith(('.pdf', '.ppt', '.pptx', '.zip')):
            return urljoin(base_url, href)
            
    return None

for w in data:
    if str(w.get('number')) == '3':
        for session in w.get('presentation_sessions', []):
            for p in session.get('presentations', []):
                legacy_url = p.get('legacy_url', '').strip()
                if legacy_url and legacy_url.endswith('.htm'):
                    try:
                        req = urllib.request.Request(legacy_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req) as response:
                            html = response.read().decode('utf-8', errors='ignore')
                            direct_link = extract_direct_link(html, legacy_url)
                            if direct_link:
                                p['legacy_url'] = direct_link
                                print(f"Updated: {legacy_url} -> {direct_link}")
                                if direct_link.lower().endswith('.zip'):
                                    zip_files.append(direct_link)
                            else:
                                print(f"Could not find direct link in {legacy_url}")
                    except Exception as e:
                        print(f"Error fetching {legacy_url}: {e}")
                        
        for p in w.get('posters', []):
            legacy_url = p.get('legacy_url', '').strip()
            if legacy_url and legacy_url.endswith('.htm'):
                try:
                    req = urllib.request.Request(legacy_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req) as response:
                        html = response.read().decode('utf-8', errors='ignore')
                        direct_link = extract_direct_link(html, legacy_url)
                        if direct_link:
                            p['legacy_url'] = direct_link
                            print(f"Updated: {legacy_url} -> {direct_link}")
                            if direct_link.lower().endswith('.zip'):
                                zip_files.append(direct_link)
                        else:
                            print(f"Could not find direct link in {legacy_url}")
                except Exception as e:
                    print(f"Error fetching {legacy_url}: {e}")
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

if zip_files:
    print(f"Found {len(zip_files)} zip files.")
    with open('zip_files_3rd_workshop.md', 'w') as f:
        f.write('# ZIP Files found in 3rd Workshop Legacy URLs\n\n')
        for z in zip_files:
            f.write(f"- {z}\n")
else:
    print("No ZIP files found.")
