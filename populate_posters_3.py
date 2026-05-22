import json

md_content = """
| # | Title | Authors | Presenter | Legacy Poster URL | Legacy Abstract URL |
|:--|:------|:--------|:----------|:------------------|:--------------------|
| 1 | "Airborne Deployment of the Aerosol Mass Spectrometer during the ACE-Asia Field Campaign" | Jose Jimenez, Roya Bahreini, Richard Flagan, John H. Seinfeld, Haflidi Jonnson, John Jayne, Douglas Worsnop | **Jose Jimenez** [PRESENTER] | Presentations 3rd/Jimenez/index.htm | Abstracts 3rd/3rdposter.htm#Airborne |
| 2 | "Microfabrication of Cylindrical Ion Trap Mass Spectrometer Arrays" | Tim Short, David Fries, Gottfried P. G. Kibelka, Himani Peddanenikalva, Shekhar Bhansali | **Tim Short** [PRESENTER] | Presentations 3rd/Short/index.htm | Abstracts 3rd/3rdposter.htm#Microfabrication |
| 3 | "Adaptation of a commercially available RGA for use onboard the ISS" | Norbert Mueller, Roman Sonderegger, Daniel Vogel, Carlos Pereira | **Norbert Mueller** [PRESENTER] | Presentations 3rd/Mueller/index.htm | Abstracts 3rd/3rdposter.htm#Adaptation |
| 4 | "Miniaturized GC/MS Instrumentation: MEMS-based Gas Chromatography Coupled with Miniature Quadrupole Array and Paul Ion Trap Mass Spectrometers" | Paul M. Holland, Ara Chutjian, Murray Darrach, Otto Orient | **Paul M. Holland** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Miniaturized |
| 5 | "Dual Source Time-of-Flight Mass Spectrometer and Sample Handling System" | William B. Brinckerhoff, Timothy J. Cornish, P. R. Mahaffy | **William B. Brinckerhoff** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Dual |
| 6 | "Real Time Volcanic Gas Monitoring Station using "In-Situ" Mass Spectrometry at Irazu Volcano" | Jorge A. Diaz, W. Ronald Gentry, Clayton F. Giese, Eduardo Malavassi, Erick Fernandez, Eliecer Duarte, Juan Valdez | **Jorge A. Diaz** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Real |
| 7 | "Ion Trap Secondary Ion Mass Spectrometry - Moving Toward Fieldable Systems" | Anthony D. Appelhans, J. E. Olson | **Anthony D. Appelhans** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Ion |
| 8 | "The Improved Teeny-TOF Mass Spectrometer for Chemical and Biological Sensing" | Scott A. Ecelberger, Timothy J. Cornish, Wayne A. Bryden | **Scott A. Ecelberger** [PRESENTER] | Presentations 3rd/Ecelberger/index.htm | Abstracts 3rd/3rdposter.htm#Improved |
| 9 | "Multimembrane Inlet System for Mass Spectrometry Analysis" | Olga S. Viktorova, V. T.Kogan, A. K.Pavlov, Y. V. Chichagov, B. M. Dubenskii, S. P. Parinov, A. G. Vitenberg, T. Kotiaho, R. Ketola | **Olga S. Viktorova** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Multimembrane |
| 10| "A High-Performance Handheld Gas Chromatograph" | Conrad M. Yu | **Conrad M. Yu** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Performance |
| 11| "Detection of 'Unknown Agents' in Harsh Environments using a Newly Developed Ruggedized Mass Spectrometer" | Kevin J. Hart, Irene F. Robbins, Marcus B. Wise, Wayne H. Griest, Stephen A. Lammert, Cyril V. Thompson | **Kevin J. Hart** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Unknown |
| 12| "A Rugged and Compact Time-of-Flight Mass Spectrometer for Fast and Sensitive Leak Detection" | Marc Gonin, Katrin Fuhrer, Michael Ugarov, Val Vaughn, Steve Ulrich, Michael McCully, Albert Schultz | **Marc Gonin** [PRESENTER] | | Abstracts 3rd/3rdposter.htm#Unknown |

#### Institutes Referenced in Posters

| Poster # | Institute Name |
|:---------|:---------------|
| 1        | California Institute of Technology |
| 1        | Naval Postgraduate School |
| 1        | Aerodyne Research |
| 2        | Center for Ocean Technology, University of South Florida |
| 2        | Dept. of Electrical Engineering, University of South Florida |
| 3        | Inficon AG, Liechtenstein |
| 3        | HTS AG, Switzerland |
| 4        | Jet Propulsion Laboratory |
| 5        | Johns Hopkins University/Applied Physics Laboratory |
| 5        | NASA/Goddard Space Flight Center |
| 6        | Universidad de Costa Rica |
| 6        | University of Minnesota |
| 6        | Observatorio Vulcanologico y Sismologico de Costa Rica (OVSICORI) |
| 6        | Laboratorio de Quimica de la Atmosfera (LAQAT), Universidad Nacional |
| 7        | Idaho National Engineering and Environmental Laboratory (INEEL) |
| 8        | Johns Hopkins University Applied Physics Laboratory |
| 9        | A. F.Ioffe Physical Technical Institute, St.Petersburg, Russia |
| 9        | AOZT "Analytic," St.Petersburg, Russia |
| 9        | St.Petersburg State University, Russia |
| 9        | Helsinki University, Finland |
| 9        | VTT Chemical Technology, Helsinki, Finland |
| 10       | Lawrence Livermore National Laboratory |
| 11       | Oak Ridge National Laboratory |
| 12       | Ionwerks, Inc. |
"""

def extract_initials(name):
    parts = name.split()
    if len(parts) >= 2:
        return f"{parts[0][0]}. {parts[-1][0]}."
    elif len(parts) == 1:
        return f"{parts[0][0]}."
    return ""

def clean_title(title):
    return title.strip('" ')

posters = []
parsing_posters = False
parsing_institutes = False

for line in md_content.split('\n'):
    line = line.strip()
    
    if '| #' in line and '| Title' in line:
        parsing_posters = True
        parsing_institutes = False
        continue
        
    if '| Poster #' in line and '| Institute Name' in line:
        parsing_posters = False
        parsing_institutes = True
        continue
        
    if parsing_posters and line.startswith('|') and not line.startswith('|:-'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 6:
            num = parts[0]
            title = clean_title(parts[1])
            authors_str = parts[2]
            presenter_raw = parts[3]
            presenter = presenter_raw.replace('**', '').replace('[PRESENTER]', '').strip()
            legacy_pres = parts[4]
            legacy_abs = parts[5]
            
            author_names = [a.strip() for a in authors_str.split(',')]
            author_objs = []
            for a_name in author_names:
                is_presenter = False
                if a_name == presenter or presenter in a_name or a_name in presenter:
                    is_presenter = True
                
                author_objs.append({
                    'name': a_name,
                    'isPresenter': is_presenter,
                    'institute': None
                })
            
            # Ensure exactly one presenter
            presenters_found = sum(1 for a in author_objs if a['isPresenter'])
            if presenters_found == 0 and author_objs:
                # try to find by last name
                p_last = presenter.split()[-1] if presenter else ''
                matched = False
                for a in author_objs:
                    if p_last and p_last in a['name']:
                        a['isPresenter'] = True
                        matched = True
                        break
                if not matched:
                    author_objs[0]['isPresenter'] = True
            elif presenters_found > 1:
                # too many, keep only first
                found_first = False
                for a in author_objs:
                    if a['isPresenter']:
                        if not found_first:
                            found_first = True
                        else:
                            a['isPresenter'] = False
            
            poster = {
                "_num": num,
                "title": title,
                "authors": author_objs,
                "presenter": presenter,
                "presenter_initials": extract_initials(presenter),
                "institutes": [],
                "legacy_poster_url": legacy_pres,
                "legacy_abstract_url": legacy_abs
            }
            posters.append(poster)
            
    if parsing_institutes and line.startswith('|') and not line.startswith('|:-'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 2:
            num = parts[0]
            institute = parts[1]
            
            for p in posters:
                if p['_num'] == num:
                    p['institutes'].append(institute)
                    break

# Cleanup _num
for p in posters:
    p.pop('_num', None)

file_path = 'c:/Antigravity/HEMS-website/src/frontend/src/data/master_workshops.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for w in data:
    if str(w.get('number')) == '3':
        w['posters'] = posters
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Updated posters for 3rd workshop.')
