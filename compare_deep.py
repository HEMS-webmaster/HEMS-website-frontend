import json
m=json.load(open('src/frontend/src/data/master_workshops.json', encoding='utf-8'))
tm=json.load(open('temp_master.json', encoding='utf-16'))

w_m = m[13]
w_tm = tm[13]

print("m total keys:", len(w_m.keys()))
print("tm total keys:", len(w_tm.keys()))

m_sponsors = w_m.get('sponsors', [])
tm_sponsors = w_tm.get('sponsors', [])
print("sponsors:", len(m_sponsors), len(tm_sponsors))

m_awards = w_m.get('student_awards', [])
tm_awards = w_tm.get('student_awards', [])
print("awards:", len(m_awards), len(tm_awards))

m_posters = w_m.get('posters', [])
tm_posters = w_tm.get('posters', [])
print("posters:", len(m_posters), len(tm_posters))

# presentations
m_pres = sum(len(s.get('presentations', [])) for s in w_m.get('presentation_sessions', []))
tm_pres = len(w_tm.get('presentations', []))
print("presentations:", m_pres, tm_pres)
