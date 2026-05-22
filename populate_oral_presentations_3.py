import json
import re

md_content = """
### Session: Technical Session I: Space Environments
- **Date:** 2002-03-26
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 8:45 a.m. | "Novel Mass Spectrometric Approaches to the In situ Chemical Analysis of Galactic and Cometary Dust Particles" | Jack Beauchamp, Daniel E. Austin, Thomas J. Ahrens | **Jack Beauchamp** [PRESENTER] | Presentations 3rd/Beauchamp/index.htm | Abstracts 3rd/3rdhemstalks.htm |
| 2 | 9:45 a.m. | "Mass Spectrometers in Deep Space Missions" | Paul Mahaffy, Hasso Niemann, Dan Harpold | **Paul Mahaffy** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Mass |
| 3 | 10:15 a.m. | "Quadrupole Ion Trap Mass Spectrometry for Space Shuttle Ground Support" | Andrew Ottens, W. Harrison, Timothy Griffin, William Helms | **Andrew Ottens** [PRESENTER] | Presentations 3rd/Ottens/index.htm | Abstracts 3rd/3rdhemstalks.htm#Quadrupole |
| 4 | 11:00 a.m. | "Test of the a Miniature Double-Focusing Mass Spectrometer for the Variable Specific Magnetoplasma Rocket (VASIMR) at the Advanced Space Propulsion Laboratory (ASPL)" | Jorge Diaz, Franklin Chang-Diaz, Jared P. Squire, Verlin Jacobson, Greg McCaskill, Andres E. Mora Vargas, Henry Rohrs, Rajiv Chhatwal | **Jorge Diaz** [PRESENTER] | Presentations 3rd/Diaz/index.htm | Abstracts 3rd/3rdhemstalks.htm#Test |
| 5 | 11:30 a.m. | "Regolith Evolved Gas Analyzer (REGA): An Instrument to Characterize the Martian Soil Mineralogy and Atmospheric Composition" | John H. Hoffman | **John H. Hoffman** [PRESENTER] | Presentations 3rd/Hoffman/index.htm | Abstracts 3rd/3rdhemstalks.htm#Regolith |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | California Institute of Technology |
| 2      | NASA/ Goddard Space Flight Center |
| 3      | University of Florida |
| 3      | Dynacs Inc. |
| 3      | NASA/ Kennedy Space Center |
| 4      | Universidad de Costa Rica |
| 4      | ASPL and Astronaut, NASA/Johnson Space Center |
| 4      | ASPL- NASA/Johnson Space Center |
| 4      | Mass Sensors, Inc. |
| 5      | University of Texas at Dallas |

### Session: Technical Session II: Mass Spectrometers for Underwater Applications
- **Date:** 2002-03-26
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 1:30 p.m. | "The NEPTUNE Project: An Interactive Earth-Ocean Observatory at the Scale of a Tectonic Plate" | John Delaney | **John Delaney** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#NEPTUNE |
| 2 | 2:30 p.m. | "Underwater Mass Spectrometers: Some Critical Engineering Issues" | Harold F. Hemond, Richard Camilli | **Harold F. Hemond** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Underwater |
| 3 | 3:00 p.m. | "Underwater Mass Spectrometers for Detection of VOCs and Dissolved Gases" | Gottfried Kibelka, Tim Short, David Fries | **Gottfried Kibelka** [PRESENTER] | Presentations 3rd/Kibelka/index.htm | Abstracts 3rd/3rdhemstalks.htm#Underwater |
| 4 | 3:45 p.m. | "Mass SURFER Field Mass Spectrometer System for Deep Ocean and Planetary Lander Applications" | Gary McMurtry, Steven J. Smith | **Gary McMurtry** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#SURFER |
| 5 | 4:15 p.m. | "Multisensor Data Integration and Adaptive Sampling Strategies for an Autonomous Underwater Mass Spectrometer" | Richard Camilli, Harold F. Hemond | **Richard Camilli** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Multisensor |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | School of Oceanography, University of Washington |
| 2      | Massachusetts Institute of Technology |
| 3      | Center for Ocean Technology, University of South Florida |
| 4      | School of Ocean and Earth Science and Technology (SOEST), University of Hawaii, and Pacific Environmental Technologies |
| 4      | Jet Propulsion Laboratory |
| 5      | Massachusetts Institute of Technology |

### Session: Technical Session III: Earth Environments
- **Date:** 2002-03-27
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 9:30 a.m. | "Mapping and Monitoring Complex Chemical Components in Ambient Air using Fast GC/MS and Multivariate Data Analysis" | Henk Meuzelaar, Neil S. Arnold | **Henk Meuzelaar** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Mapping |
| 2 | 10:30 a.m. | "Field-Portable, Fast GC/TOFMS" | Jack Syage, Brian Nies, Rick Harkewicz | **Jack Syage** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Field-Portable |
| 3 | 11:15 a.m. | "Portable Double-Focus Mass Spectrograph with Multymembrane Inlet" | Olga Viktorova, Viktor Kogan, Sergey Manninen | **Olga Viktorova** [PRESENTER] | Presentations 3rd/Viktorova/index.htm | Abstracts 3rd/3rdhemstalks.htm#Portable |
| 4 | 11:45 a.m. | "Addressing Forensic Field Analytical Chemistry Issues" | Brian A. Eckenrode, Valerie Cavett, Philip A. Smith, Gregory Kimm, Gary Hook, Erin Sherry | **Brian A. Eckenrode** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Addressing |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | University of Utah |
| 2      | Syagen Technology, Inc. |
| 3      | A. F. Ioffe Physical Technical Institute, St. Petersburg, Russia |
| 4      | Forensic Science Research Unit, Federal Bureau of Investigation |
| 4      | Uniformed Services University of the Health Sciences, Department of Preventive Medicine and Biometrics |
| 4      | The George Washington University, Department of Forensic Sciences |

### Session: Technical Session IV: Bio-applications
- **Date:** 2002-03-27
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 1:30 p.m. | "Detection of Microorganisms with MS: Field-Portable Instrumentation and Innovative Methodology" | Franco Basile, Angelo Madonna, Kent J. Voorhees, Stephen Lammert, Brian Musselman, Vladimir Doroshenko | **Franco Basile** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Detection |
| 2 | 2:00 p.m. | "Design of a Novel Miniature MALDI-TOF Mass Spectrometer for High Throughput Medical Screening" | Ben Gardner, Robert English, Robert Cotter | **Ben Gardner** [PRESENTER] | Presentations 3rd/Gardner/index.htm | Abstracts 3rd/3rdhemstalks.htm#Design |
| 3 | 2:30 p.m. | "Fieldable MALDI-TOF Bioaerosol Analysis System" | Wayne A. Bryden | **Wayne A. Bryden** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Fieldable |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | Colorado School of Mines (CSM) |
| 1      | Oak Ridge National Laboratory |
| 1      | Science & Engineering Services, Inc. (SESI) |
| 2      | Johns Hopkins University School of Medicine |
| 3      | Johns Hopkins University Applied Physics Laboratory |

### Session: Technical Session V: Novel Concepts / Miniaturization
- **Date:** 2002-03-27
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 3:15 p.m. | "Miniature Mass Spectrometers and Front-End Interfaces" | Ara Chutjian, Murray Darrach, Otto Orient, Paul Holland | **Ara Chutjian** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Mini |
| 2 | 4:15 p.m. | "Evaluation of Small Mass Spectrometer Systems as Candidates for the Development of Miniature Mass Spectrometer Systems" | Richard Arkin, Timothy Griffin, Andrew Ottens, Jorge Diaz, Duke Follestein, Fredrick Adams, William Helms | **Richard Arkin** [PRESENTER] | Presentations 3rd/Arkin/index.htm | Abstracts 3rd/3rdhemstalks.htm#Evaluation |
| 3 | 4:45 p.m. | "Miniature cylindrical ion trap mass spectrometry" | Jeremy Moxom, William Whitten, Peter Reilly, Michael Ramsey | **Jeremy Moxom** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Miniature |
| 4 | 5:15 p.m. | "A LIGA Fabricated Two-Dimensional Quadrupole Array for High Resolution Mass Spectroscopy" | Nosang V. Myung, Otto Orient, Kirill Shcheglov, Beverley Eyre, Dean Wiberg | **Nosang V. Myung** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#LIGA |
| 5 | 5:45 p.m. | "Concept for a Miniaturized Confocal Plane Mass Spectrometer using Micromachined Detector Array" | Adi Scheidemann, Mahadeva Sinha, Bruce Darling | **Adi Scheidemann** [PRESENTER] | | Abstracts 3rd/3rdhemstalks.htm#Concept |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | Jet Propulsion Laboratory/California Institute of Technology |
| 1      | Thorleaf Research, Inc. |
| 2      | Dynacs Inc. |
| 2      | The University of Florida |
| 2      | Universidad de Costa Rica |
| 2      | NASA/ Kennedy Space Center |
| 3      | Oak Ridge National Laboratory |
| 4      | Jet Propulsion Laboratory |
| 5      | Intelligent Ion, Inc. |
| 5      | Jet Propulsion Laboratory |
| 5      | University of Washington |

### Session: Technical Session I: Miniaturization / Technical Issues
- **Date:** 2002-03-28
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 8:45 a.m. | "The Technical Issues Associated with Highly Miniaturized Vacuum Systems" | Phil Muntz | **Phil Muntz** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#Technical |
| 2 | 9:45 a.m. | "Meso-Scale Scroll Pump Array Fabricated using LIGA Technology for Portable, High-resolution Mass Spectrometer" | Beverley Eyre, Kirill Shcheglov, Otto Orient, Nosang V. Myung, Dean Wiberg | **Beverley Eyre** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#Meso |
| 3 | 10:30 a.m. | "Performance Analysis for Meso-Scale Scroll Pumps" | Eric Moore, E. Phillip Muntz, Francis Eyre, Nosang Myung, Otto Orient, Kirill Shcheglov, Dean Wiberg | **Eric Moore** [PRESENTER] | Presentations 3rd/Moore/index.htm | Abstracts 3rd/3rdpumpstalks.htm#Performance |
| 4 | 11:00 a.m. | "The Knudsen Compressor as an Energy Efficient Micro-Scale Vacuum Pump" | Marcus Young, E. P. Muntz, G. Shiflett, A. Green | **Marcus Young** [PRESENTER] | Presentations 3rd/Young/index.htm | Abstracts 3rd/3rdpumpstalks.htm#Knudsen |
| 5 | 11:30 a.m. | "MEMS-based Low-Flow Meters" | Tom Tsao, Fukang Jiang, Edward Chiu | **Tom Tsao** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#MEMS |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | University of Southern California |
| 2      | Jet Propulsion Laboratory |
| 3      | University of Southern California |
| 4      | University of Southern California |
| 4      | Jet Propulsion Laboratory |
| 5      | Umachines, Inc. |

### Session: Technical Session II: Commercialization Issues
- **Date:** 2002-03-28
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 1:30 p.m. | "The Issues Limiting Large-scale Commercialization of Miniature Vacuum Systems" | Peter Kardok | **Peter Kardok** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#Issues |
| 2 | 2:30 p.m. | "Development of Turbomolecular Pumps for Demanding Environments" | Marc Kenton | **Marc Kenton** [PRESENTER] | Presentations 3rd/Kenton/index.htm | Abstracts 3rd/3rdpumpstalks.htm#Development |
| 3 | 3:00 p.m. | "Miniature Turbo-molecular Pump" | Rob Rowan, Mark Johnson | **Rob Rowan** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#Turbo |
| 4 | 3:45 p.m. | "KSC Miniature, Rugged Mass Spectrometer Applications and Development Progress" | Frederick Adams, Duke Follistein, Richard Arkin, Tim Griffin | **Frederick Adams** [PRESENTER] | Presentations 3rd/Adams/index.htm | Abstracts 3rd/3rdpumpstalks.htm#KSC |
| 5 | 4:15 p.m. | "Miniature Peristaltic Vacuum Pump with Magnetic Actuation" | Sabrina Feldman, Danielle Svehla | **Sabrina Feldman** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#Peristaltic |
| 6 | 4:45 p.m. | "Development of a Miniature Lightweight Ion Pump" | Mahadeva P. Sinha | **Mahadeva P. Sinha** [PRESENTER] | | Abstracts 3rd/3rdpumpstalks.htm#Pump |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | Alcatel Vaccum Products, Inc. |
| 2      | Creare, Inc. |
| 3      | Phoenix Analysis & Design Technologies |
| 4      | NASA/Kennedy Space Center |
| 4      | Dynacs, Kennedy Space Center |
| 5      | Jet Propulsion Laboratory |
| 6      | Jet Propulsion Laboratory |
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

sessions = []
current_session = None
parsing_talks = False
parsing_institutes = False

for line in md_content.split('\n'):
    line = line.strip()
    
    if line.startswith('### Session: '):
        if current_session:
            sessions.append(current_session)
        
        session_title = line.replace('### Session: ', '').strip()
        current_session = {
            'session_title': session_title,
            'date': '',
            'presentations': []
        }
        parsing_talks = False
        parsing_institutes = False
        continue
        
    if current_session and line.startswith('- **Date:**'):
        current_session['date'] = line.replace('- **Date:**', '').strip()
        continue
        
    if current_session and '| #' in line and '| Time' in line:
        parsing_talks = True
        parsing_institutes = False
        continue
        
    if current_session and '| Talk #' in line and '| Institute Name' in line:
        parsing_talks = False
        parsing_institutes = True
        continue
        
    if current_session and parsing_talks and line.startswith('|') and not line.startswith('|:-'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 7:
            num = parts[0]
            time = parts[1]
            title = clean_title(parts[2])
            authors = parts[3]
            presenter_raw = parts[4]
            presenter = presenter_raw.replace('**', '').replace('[PRESENTER]', '').strip()
            legacy_pres = parts[5]
            legacy_abs = parts[6]
            
            presentation = {
                "_num": num, # Temp
                "time": time,
                "end_time": "",
                "title": title,
                "authors": authors,
                "presenter": presenter,
                "presenter_initials": extract_initials(presenter),
                "institutes": [],
                "legacy_presentation_url": legacy_pres,
                "legacy_abstract_url": legacy_abs
            }
            current_session['presentations'].append(presentation)
            
    if current_session and parsing_institutes and line.startswith('|') and not line.startswith('|:-'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 2:
            num = parts[0]
            institute = parts[1]
            
            for p in current_session['presentations']:
                if p['_num'] == num:
                    p['institutes'].append(institute)
                    break

if current_session:
    sessions.append(current_session)

# Cleanup _num
for s in sessions:
    for p in s['presentations']:
        p.pop('_num', None)

file_path = 'c:/Antigravity/HEMS-website/src/frontend/src/data/master_workshops.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for w in data:
    if str(w.get('number')) == '3':
        w['presentation_sessions'] = sessions
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Updated oral presentations for 3rd workshop.')
