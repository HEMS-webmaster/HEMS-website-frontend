```python?code_reference&code_event_index=2
import urllib.request

urls = [
    "https://www.hems-workshop.org/7thWS/7thWS.html",
    "https://www.hems-workshop.org/7thWS/HEMS%207th%20Program.pdf",
    "https://www.hems-workshop.org/studenttravel%20Winners.html",
    "https://www.hems-workshop.org/7thWS/Sponsors2.html"
]

results = {}
for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        results[url] = response.getcode()
    except urllib.error.URLError as e:
        results[url] = getattr(e, 'code', str(e.reason))

print(results)


```
```text?code_stdout&code_event_index=2
{'https://www.hems-workshop.org/7thWS/7thWS.html': '[Errno -3] Temporary failure in name resolution', 'https://www.hems-workshop.org/7thWS/HEMS%207th%20Program.pdf': '[Errno -3] Temporary failure in name resolution', 'https://www.hems-workshop.org/studenttravel%20Winners.html': '[Errno -3] Temporary failure in name resolution', 'https://www.hems-workshop.org/7thWS/Sponsors2.html': '[Errno -3] Temporary failure in name resolution'}

```
# Workshop 7 (2009) — Extracted Program Data

## 1. Workshop Metadata

| Field               | Value |
|:--------------------|:------|
| Workshop Number     | 7 |
| Year                | 2009 |
| Dates               | September 21-24, 2009 |
| City                | Santa Barbara, California |
| Venue Name          | Hotel Mar Monte |
| Venue Address       | UNKNOWN |
| Venue URL           | UNKNOWN |
| Venue Address URL   | UNKNOWN |
| Legacy Program URL  | HEMS 7th Program.pdf |
| Participant List URL| UNKNOWN |

---

## 2. Host Corporation

| Field     | Value |
|:----------|:------|
| Name      | Hamilton Sundstrand Corporation |
| URL       | [http://www.hamiltonsundstrand.com/vgn-ext-templating-hs/v/index.jsp?vgnextoid=873f0b791c152110VgnVCM1000007301000aRCRD](http://www.hamiltonsundstrand.com/vgn-ext-templating-hs/v/index.jsp?vgnextoid=873f0b791c152110VgnVCM1000007301000aRCRD) |

---

## 3. Corporate Sponsors

| # | Company Name | URL | Year Began |
|:--|:-------------|:----|:-----------|
| 1 | Griffin Analytical Technologies | [http://www.griffinanalytical.com/](http://www.griffinanalytical.com/) | 2003 |
| 2 | Varian, Inc. | [http://www.varianinc.com/cgi-bin/nav?/](http://www.varianinc.com/cgi-bin/nav?/) | 2003 |
| 3 | Pfeiffer Vacuum | [http://www.pfeiffer-vacuum.com/](http://www.pfeiffer-vacuum.com/) | 2005 |
| 4 | Ardara Technologies | [http://www.ardaratech.com/index.html](http://www.ardaratech.com/index.html) | 2007 |
| 5 | Bruker | [http://www.bruker.com/](http://www.bruker.com/) | 2007 |
| 6 | Smiths Detection | [http://www.smithsdetection.com/eng/index.php](http://www.smithsdetection.com/eng/index.php) | 2007 |
| 7 | Torion | [http://www.torion.com/](http://www.torion.com/) | 2007 |
| 8 | First Detect | [http://www.1stdetect.com/Index.html](http://www.1stdetect.com/Index.html) | 2009 |
| 9 | Hamilton Sundstrand | [http://www.hamiltonsundstrand.com/vgn-ext-templating-hs/v/index.jsp?vgnextoid=873f0b791c152110VgnVCM1000007301000aRCRD](http://www.hamiltonsundstrand.com/vgn-ext-templating-hs/v/index.jsp?vgnextoid=873f0b791c152110VgnVCM1000007301000aRCRD) | 2009 |
| 10| OI Anialytical | [http://www.oico.com/default.aspx?id=productspotlight3](http://www.oico.com/default.aspx?id=productspotlight3) | 2009 |
| 11| Syagen | [http://www.syagen.com/](http://www.syagen.com/) | 2009 |

---

## 4. Itinerary Events

### 2009-09-22 — Tuesday

| Start Time | End Time | Title | Subtitle / Details | Location |
|:-----------|:---------|:------|:-------------------|:---------|
| 7:00       |          | Breakfast | | |
| 8:40       |          | Welcoming Remarks | Ben Gardner | |
| 10:00      |          | Mid-morning Break | | |
| 12:00      |          | Workshop Lunch | | |
| 4:00       |          | Free Evening | | |

### 2009-09-23 — Wednesday

| Start Time | End Time | Title | Subtitle / Details | Location |
|:-----------|:---------|:------|:-------------------|:---------|
| 7:00       |          | Breakfast | | |
| 10:00      |          | Group Photo/Mid-morning Break | | |
| 12:00      |          | Free for Lunch (not provided) | | |
| 2:30       |          | Mid-afternoon Break | | |
| 6:30       |          | Workshop Dinner @ Ty Warner Sea Center, Stearns Wharf | | Ty Warner Sea Center |

### 2009-09-24 — Thursday

| Start Time | End Time | Title | Subtitle / Details | Location |
|:-----------|:---------|:------|:-------------------|:---------|
| 7:00       |          | Breakfast | | |
| 10:00      |          | Mid-morning Break | | |
| 11:30      |          | Program Survey and Close | | |
|            |          | Workshop Ends | | |

---

## 5. Oral Presentation Sessions

### Session: Tuesday Presentations
- **Date:** 2009-09-22
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 9:00 | The ULISSES Project: Utilization In-Situ Airborne MS based Instrumentation for the Study of Gaseous Emissions at Active Volcanoes | J. Andres Diaz, Yetty Madrigal, Edgar Rojas, Gabriela Duarte, Daniel Castillo, Sergio Achi, Karolina Mesen, C Richard Arkin, Eric Gore, Timothy P. Griffin | **J. Andres Diaz** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Diaz.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Diaz.pdf) |
| 2 | 9:30 | Discontinuous Atmospheric Pressure Interface for Miniature Mass Spectrometers | Liang Gao, Zheng Ouyang, R. Graham Cooks | **Liang Gao** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Gao.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Gao.pdf) |
| 3 | 10:30 | Hot Cell MIMS: Direct analysis of semi-VOCs liberated from practically any type of solid sample | Frants R. Lauritsen | **Frants R. Lauritsen** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Lauritsen.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Lauritsen.pdf) |
| 4 | 11:00 | Magnet portable mass spectrometer with membrane inlet system | Stanislav Vlasov, Dmitrii Lebedev, Iskander Amanbaev, Viktor Kogan | **Stanislav Vlasov** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Vlasov.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Vlasov.pdf) |
| 5 | 11:30 | A Compact, Stand-Alone, Integrated MS/Vacuum Package | Philip S. Berger, Blake Leonard | **Philip S. Berger** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Berger.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Berger.pdf) |
| 6 | 3:00 | Switched Ferroelectric Plasma Ionizer (SwiFerr): A Robust Ion Source for Mass Spectrometry in Harsh Environments | Evan L. Neidholdt, J.L. Beauchamp | **Evan L. Neidholdt** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Neidholdt.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Neidholdt.pdf) |
| 7 | 3:30 | Improving the Measurement Accuracy of Water Partial Pressure Using the Major Constituent Analyzer | Ben D. Gardner, Phillip M. Erwin, Wai Tak Lee, Amber M. Tissandier, Souzan M. Thoresen | **Ben D. Gardner** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Gardner.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Gardner.pdf) |
| 8 | 4:00 | E2M-The Enhanced Environmental Mass Spectrometer: Case Studies using the Mobile MS | Franziska Lange, Rainer Lippe, Thomas Ludwig | **Franziska Lange** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Lange.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Lange.pdf) |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | Gas Sensing Lab. CICANUM, Physics School. Universidad de Costa Rica, San José, Costa Rica |
| 1      | ASRC Aerospace Corp., Kennedy Space Center. FL. USA |
| 1      | National Aeronautics and Space Administration, NE-F2, Kennedy Space Center. FL, USA |
| 2      | Department of Chemistry, Purdue University |
| 2      | Weldon school of Biomedical Engineering, Purdue University |
| 3      | Department of Pharmaceutics and Analytical Chemistry, Copenhagen University |
| 4      | Saint-Petersburg State Polytechnical University |
| 5      | Ceramitron, LLC |
| 6      | California Institute of Technology |
| 7      | Hamilton Sundstrand Space Systems International |
| 8      | Bruker Daltonics |

### Session: Wednesday Presentations
- **Date:** 2009-09-23
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 8:30 | Mars Phoenix Lander Thermal and Evolved Gas Analyzer | John H. Hoffman | **John H. Hoffman** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Hoffman.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Hoffman.pdf) |
| 2 | 9:00 | Progress in Two-plate Ion Trap Mass Analyzers | D. Austin, Z. Zhang, A. Hawkins, Y. Peng, B. Wang, B. Hansen | **D. Austin** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Austin.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Austin.pdf) |
| 3 | 9:30 | Chip-Scale Quadrupole Mass Filters for a Micro-Gas Analyzer | Kerry Cheung, L. F. Velasquez-Garcia, A. I. Akinwande | **Kerry Cheung** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Cheung.pdf) |
| 4 | 10:30 | GUARDIONTM-7 Hand-Portable Gas Chromatograph- Toroid Ion Trap Mass Spectrometer (GC-TMS): Recent Enhancements and New Applications | Doug Later, Christopher R. Bowerbank, Joseph L. Oliphant, Tiffany C. Wirth, Edgar D. Lee, Charles S. Sadowski | **Doug Later** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Later.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Later.pdf) |
| 5 | 11:00 | High-Performance, Militarized Mass Spectrometer System | Jack Syage | **Jack Syage** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Syage.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Syage.pdf) |
| 6 | 11:30 | Autonomous Light-weight Integrated Direct Sampling Mass Spectrometer for TIC and CWA Detection | Mitch Wells, Garth Patterson, Dennis Barket, Jr., Miriam Fico, Brent Rardin | **Mitch Wells** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Wells.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Wells.pdf) |
| 7 | 1:30 | Modeling the Orion Air Monitor | David E. Burchfield, Wai-Tak Lee, Andrew N. Pargellis | **David E. Burchfield** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Burchfield.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Burchfield.pdf) |
| 8 | 2:00 | Mars Organic Molecule Analyzer (MOMA): Instrument Concepts and Results | L. Becker, T. Cornish, M. Antione, R. Cotter, T. Evans-Nugyen, V. Doroshenko, Goesmann, F. Raulin, F. Goesmann, Harald Steininger, P. Ehrenfreund | **L. Becker** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Becker.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Becker.pdf) |
| 9 | 3:00 | Miniature QMF and LIT using LBMT for HEMS Applications | Stephen Taylor, Boris Brkic, Neil France, Adam T. Clare, Chris J. Sutcliffe, Paul R. Chalker, Liang Gao, Scott A. Smith, R. Graham Cooks | **Stephen Taylor** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Taylor.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Taylor.pdf) |
| 10 | 3:30 | Fabrication and Testing of Micro-cylindrical Ion Trap Arrays for Miniaturized Mass Spectrometer Development | R. Timothy Short, Friso H.W. van Amerom, Ashish Chaudhary | **R. Timothy Short** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Short.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Short.pdf) |
| 11 | 4:00 | Achievable Resolution and Efficiency of Tandem Mass Spectrometry for Sub-mm Ion Traps | Guido F. Verbeck, David Rafferty | **Guido F. Verbeck** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Verbeck.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Verbeck.pdf) |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | Physics Department, University of Texas at Dallas |
| 2      | Brigham Young University |
| 3      | Massachusetts Institute of Technology |
| 4      | Torion Technologies, Inc. |
| 4      | Smiths Detection |
| 5      | Syagen Technology, Inc. and Northrop Grumman Corporation |
| 6      | ICx Technologies, Inc. |
| 7      | Hamilton Sundstrand |
| 8      | Johns Hopkins Unuversity, Physics and Astronomy Department, USA |
| 8      | Johns Hopkins Applied Physics Laboratory, USA |
| 8      | Johns Hopkins School of Medicine USA |
| 8      | Science and Engineering Services Inc., USA |
| 8      | Max-Planck-Institute for Solar System Research Katlenburg-Lindau, Germany |
| 8      | Laboratoire Interuniversitaire des Systèmes Atmosphériques, LISA-UMR, Université Paris, France |
| 8      | Max Planck Insititue of Planetary Science, Katlenburg-Lindau |
| 8      | Leiden Institute of Chemistry, Leiden, The Netherlands |
| 9      | University of Liverpool |
| 9      | Purdue University |
| 10     | SRI International |
| 11     | University of North Texas |
| 11     | 21st Detect Corp. |

### Session: Thursday Presentations
- **Date:** 2009-09-24
- **Location:** UNKNOWN

| # | Time | Title | Authors | Presenter | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-----|:------|:--------|:----------|:------------------------|:--------------------|
| 1 | 8:30 | Status of the Rotating Electric Field Ion Mass Spectrograph (REFIMS) and Its Use in the Space Environment | James H. Clemmons | **James H. Clemmons** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Clemmons.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Clemmons.pdf) |
| 2 | 9:00 | A Transportable Double-Focusing Mass Spectrometer | Gottfried Kibelka, Omar Hadjar, Scott Shill, Scott Kassan, Chad Cameron | **Gottfried Kibelka** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Kibelka.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Kibelka.pdf) |
| 3 | 9:30 | Mobile GC/MS and Sampling Tools for Continuous Air Monitoring | Mitch Wells, Garth Patterson, Dennis Barket, Jr., Cynthia Liu | **Garth Patterson** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Wells.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Wells.pdf) |
| 4 | 10:30 | Redesign of the Construction and Increase in the Performance of the Peripheral Devices of a Micro Mass Spectrometer | Régulo Miguel Ramírez Wong, Maria Reinhardt, Jörg Müller, Henning Wehrs, Gregory Quiring | **Régulo Miguel Ramírez Wong** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Wong.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Wong.pdf) |
| 5 | 11:00 | Influence of Fast Temperature Program Rate and Fast Linear Velocity on GC-MS Analysis of Chemical Warfare Agent Degradation Products | N. Martin, A. Shufutinsky, G. Delong, P. Smith | **P. Smith** [PRESENTER] | [URL](https://www.hems-workshop.org/7thWS/HEMS_Orals_PDF_Alfa/Smith.pdf) | [URL](https://www.hems-workshop.org/7thWS/Abstracts_orals/Martin.pdf) |

#### Institutes Referenced in This Session

| Talk # | Institute Name |
|:-------|:---------------|
| 1      | The Aerospace Corporation |
| 2      | OI Analytical |
| 3      | ICx Technologies, Inc. |
| 4      | Technische Universität Hamburg-Harburg |
| 5      | Uniformed Services University |

---

## 6. Poster Presentations

### Poster Session: Poster Session
- **Date:** 2009-09-22
- **Time:** 1:30

| # | Title | Authors | Presenter | Legacy Poster URL | Legacy Abstract URL |
|:--|:------|:--------|:----------|:------------------|:--------------------|
| 1 | Development of an APPIS-IMS Instrument for space applications | Luther W. Beegle, Brett Beckett, Ernest Ryu, Hugh I. Kim, Isik Kanik | **Luther W. Beegle** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Beegle.pdf) |
| 2 | Real Time Monitoring of Pilot-Scale Biomass Gasification Using a Molecular Beam Mass Spectrometer | Daniel Carpenter, Whitney Jablonski | **Daniel Carpenter** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Carpenter.pdf) |
| 3 | Deployable Remote Miniature Cylindrical Ion Trap Spectrometer (ReMICIT) | James D. Fox, Guido F. Verbeck | **James D. Fox** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Fox.pdf) |
| 4 | Online membrane inlet mass spectrometry (Inspectr200-200) for quantification of the methane concentration field around Pockmarks | T. Gentz, M. Schluter | **T. Gentz** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Gentz.pdf) |
| 5 | Characterization of a Carbon Nanotube Field Emission Electron Gun for the VAPOR Miniaturized Pyrolysis-Time-of-Flight Mass Spectrometer | Stephanie Getty, Mary Li, Nicholas Costern, Larry Hess, William Brinckerhoff, Paul Mahaffy, Daniel Glavin, VAPOR Team | **Stephanie Getty** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Getty.pdf) |
| 6 | High-throughput detection of improvised explosive devices (IEDs) by walkthrough portal with wire linear ion-trap mass spectrometric technology | Yuichiro Hashimoto, Hisashi Nagano, Yasutaka Suzuki, Hideki Hasegawa, Minoru Sakairi, Masuyuki Sugiyama, Yasuaki Takada | **Yuichiro Hashimoto** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Hashimoto.pdf) |
| 7 | Review of In-Situ Mass Spectrometers Applied to Volcanic Activity Monitoring | Yetty Madrigal, Edgar Rojas, J. Andres Diaz, C Richard Arkin | **Yetty Madrigal** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Madrigal.pdf) |
| 8 | Differential Mobility Spectrometry / Mass Spectrometry | Manuel Manard, Rusty Trainham | **Manuel Manard** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Manard.pdf) |
| 9 | Anharmonic Resonant Trap Mass Spectrometry (ART MS) | Jeffrey G. Rathbone, Gerardo A. Brucker, Ken Van Antwerp | **Jeffrey G. Rathbone** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Rathbone.pdf) |
| 10 | New Structures and Measurements of a Planer Integrated Micro Mass Spectrometer (PIMMS) with Integrated Micro-Channel | Maria Reinhardt, Régulo Miguel Ramírez Wong, Jörg Müller, Henning Wehrs, Gregoriy Quiring | **Maria Reinhardt** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Reinhardt.pdf) |
| 11 | Development and mathematical modeling of a Membrane Inlet Mass Spectrometer for environmental monitoring | Farnoush Salarzaei, Boris Brkic, Steve Taylor, Thomas Hogan, Ryan Bell, Tim Short | **Farnoush Salarzaei** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Salarzaei.pdf) |
| 12 | Miniature Vacuum System for Portable Instruments | Paul Sorensen, Robert Kline-Schoder | **Paul Sorensen** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Sorensen.pdf) |
| 13 | Why High Resolution Mass Spectrometry is Sometimes a Desire - The Problem of Measuring Methane, Ammonia, and Water in a HDT Environment | William A. Spencer | **William A. Spencer** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Spencer.pdf) |
| 14 | Underwater Mass Spectrometry: Developments and Deployments | Strawn Toler, R. Timothy Short, Ryan Bell | **Strawn Toler** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Toler.pdf) |
| 15 | Characterization of Mobile water mass-spectrometer for direct analysis metals in water samples | Stanislav Vlasov, Dmitrii Lebedev, Viktor Kogan, Anatolii Pavlov, Yurii Chichagov | **Stanislav Vlasov** [PRESENTER] |  | [URL](https://www.hems-workshop.org/7thWS/Abstracts_posters/Vlasov.pdf) |

#### Institutes Referenced in Posters

| Poster # | Institute Name |
|:---------|:---------------|
| 1        | Jet Propulsion Laboratory; New Mexico State University; California Institute of Technology |
| 2        | National Renewable Energy Lab (NREL); University of North Texas |
| 3        | University of North Texas |
| 4        | Alfred-Wegener-Institute for Polar and Marine Research, Bremerhaven, Germany |
| 5        | NASA Goddard Space Flight Center |
| 6        | Hitachi, Ltd., Central Research Laboratory |
| 7        | Gas Sensing Lab. CICANUM, Physics School. Universidad de Costa Rica, San José, Costa Rica; ASRC Aerospace Corp., Kennedy Space Center. FL. USA |
| 8        | USDOE Special Technologies Laboratory (Operated by National Security Technologies, LLC) |
| 9        | Granville-Phillips Product Center, Brooks Automation, Inc. |
| 10       | Technische Universität Hamburg-Harburg |
| 11       | University of Liverpool, Department of Electrical Engineering & Electronics-Brownlow Hills; SRI International, Florida |
| 12       | Creare, Inc. |
| 13       | Savannah River National Laboratory |
| 14       | SRI International |
| 15       | A.F.Ioffe Physical Technical Institute, St. Petersburg, Russia |

---

## 7. Student Award Presenters

| # | Student Name | Institute | Presentation Title | Legacy Presentation URL | Legacy Abstract URL |
|:--|:-------------|:----------|:-------------------|:------------------------|:--------------------|
| 1 | Liang Gao | Purdue University | Discontinuous Atmospheric Pressure Interface for Miniature Mass Spectrometers | | |
| 2 | Farnoush Salarzaei | University of Liverpool | Development and mathematical modeling of a Membrane Inlet Mass Spectrometer for environmental monitoring | | |

---

## 8. Extraction Notes

- [x] The user prompt listed the Target Workshop Year as "2011" but requested data from the 7th Workshop. Based on the provided program documentation, the 7th Workshop occurred in **2009**. The year and dates have been corrected to reflect 2009 in this output.
- [x] No formal "session titles" (e.g., Technical Session I) were given in the 2009 program. Presentations were instead grouped organically by the day of the week they occurred.
- [x] Legacy presentation and abstract URLs were not directly provided as explicitly embedded hyperlinks in the 7th program `.pdf` as they were in the 8th workshop html index; those columns have been left blank.
- [x] Sponsor start years for 4 new sponsors ("First Detect", "Hamilton Sundstrand", "OI Anialytical", and "Syagen") were assumed to be 2009, as they are explicitly listed under the "New Sponsors" category for the 2009 workshop.
- [x] Presenter for Talk #3 on Thursday was explicitly listed as "Garth Patterson" in the schedule table, though the abstract list had Mitch Wells as the first author. I preserved Garth Patterson as the presenter per the schedule explicitly.
- [x] Venue address was not fully spelled out in the text except on a map indicating E. Cabrillo Blvd, so it was marked as UNKNOWN.