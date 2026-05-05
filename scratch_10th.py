import json
import re

out = {
  "year": 2015,
  "ordinal": "10th",
  "dates": "September 13–16, 2015",
  "venue": "University of Maryland School of Pharmacy",
  "address": "20 N Pine St Baltimore, MD 21201",
  "resources": [
    {
      "label": "Workshop Program",
      "icon": "FileText",
      "url": "#technical-program"
    },
    {
      "label": "Program Download",
      "icon": "Download",
      "legacy_url": "https://www.hems-workshop.org/10thWS/10th HEMS draft 082115.pdf",
      "local_target_path": "/api/manager/serve?file=10th/Administrative/10th_HEMS_draft_082115.pdf",
      "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Administrative/10th_HEMS_draft_082115.pdf",
      "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Administrative/10th_HEMS_draft_082115.pdf"
    },
    {
      "label": "Participant List",
      "icon": "Users",
      "legacy_url": "https://www.hems-workshop.org/10thWS/2015Attendees.pdf",
      "local_target_path": "/api/manager/serve?file=10th/Administrative/2015Attendees.pdf",
      "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Administrative/2015Attendees.pdf",
      "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Administrative/2015Attendees.pdf"
    }
  ],
  "sponsors": [
    {"name": "Agilent Technologies (Varian Vacuum, Inc.)", "url": "http://www.vacuum-choice.com/", "image": "/images/sponsors/Agilent_Technologies.png?v=1", "year": "2003"},
    {"name": "FLIR (Griffin Analytical Technologies)", "url": "http://www.icxt.com/technology/mobile-labs/", "image": "/images/sponsors/FLIR_Griffin_Analytical_Technologies.png?v=1", "year": "2003"},
    {"name": "Pfeiffer Vacuum", "url": "http://www.pfeiffer-vacuum.com/", "image": "/images/sponsors/Pfeiffer_Vacuum.png?v=1", "year": "2005"},
    {"name": "Ardara Technologies", "url": "http://www.ardaratech.com/index.html", "image": "/images/sponsors/Ardara_Technologies.png?v=1", "year": "2007"},
    {"name": "OI Analytical", "url": "http://www.oico.com/", "image": "/images/sponsors/OI_Analytical.png?v=1", "year": "2009"},
    {"name": "DeTech", "url": "http://www.detechinc.com/", "image": "/images/sponsors/DeTech.png?v=1", "year": "2011"},
    {"name": "University of North Texas", "url": "http://www.unt.edu/", "image": "/images/sponsors/University_of_North_Texas.png?v=1", "year": "2011"},
    {"name": "Edwards", "url": "http://www.edwardsvacuum.com/", "image": "/images/sponsors/Edwards.png?v=1", "year": "2013"},
    {"name": "Inficon", "url": "http://www.inficon.com/", "image": "/images/sponsors/Inficon.png?v=1", "year": "2013"},
    {"name": "MassTech, Inc.", "url": "http://www.apmaldi.com/", "image": "/images/sponsors/MassTech_Inc.png?v=1", "year": "2013"},
    {"name": "BaySpec, Inc.", "url": "http://www.bayspec.com/", "image": "/images/sponsors/BaySpec.png?v=1", "year": "UNKNOWN"},
    {"name": "Perkin Elmer", "url": "http://www.perkinelmer.com/", "image": "/images/sponsors/Perkin_Elmer.png?v=1", "year": "UNKNOWN"}
  ],
  "schedule": []
}

schedule_data = {
    "2015-09-13": [
        {"type": "event", "time": "7:00 p.m.", "title": "Registration and Welcome Reception upstairs at Pickles Pub", "location": ""}
    ],
    "2015-09-14": [
        {"type": "event", "time": "7:30 a.m.", "title": "Set-up of Sponsor tables and registration", "location": ""},
        {"type": "event", "time": "10:00 a.m.", "title": "Welcome Remarks", "location": ""},
        {"type": "session", "time": "10:15 a.m.", "title": "Technical Session I", "location": "UNKNOWN", "talks": [
            {
                "time": "10:15 a.m.", "title": "Opening Talk: Needs and Challenges in the Field Detection and Identification of Military Chemical Threats",
                "authors": [{"name": "Kate Ong", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/monday morning session/1_Weibel.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Ong_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_I/10th_Ong_Opening_Talk_Needs_and_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_I/10th_Ong_Opening_Talk_Needs_and_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Ong_Opening_Talk_Needs_and_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Ong_Opening_Talk_Needs_and_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Ong_Opening_Talk_Needs_and_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Ong_Opening_Talk_Needs_and_Abstract.pdf"
            },
            {
                "time": "11:00 a.m.", "title": "Quadrupole Miniaturization – Reconsidered",
                "authors": [{"name": "Randy Pedder", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/monday morning session/2_Pedder.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Jacobsky_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_I/10th_Pedder_Quadrupole_Miniaturization__Reconsidered_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_I/10th_Pedder_Quadrupole_Miniaturization__Reconsidered_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Pedder_Quadrupole_Miniaturization__Reconsidered_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Pedder_Quadrupole_Miniaturization__Reconsidered_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Pedder_Quadrupole_Miniaturization__Reconsidered_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Pedder_Quadrupole_Miniaturization__Reconsidered_Abstract.pdf"
            },
            {
                "time": "11:30 a.m.", "title": "Student Award Winner: Improving the Selectivity of a High Pressure Mass Spectrometer",
                "authors": [{"name": "Andrew Hampton", "isPresenter": True}], "institutes": [{"name": "University of North Carolina - Chapel Hill"}],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/monday morning session/3_Hampton.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Hampton_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_I/10th_Hampton_Student_Award_Winner_Improving_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_I/10th_Hampton_Student_Award_Winner_Improving_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Hampton_Student_Award_Winner_Improving_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Hampton_Student_Award_Winner_Improving_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Hampton_Student_Award_Winner_Improving_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_I/10th_Hampton_Student_Award_Winner_Improving_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "12:00 p.m.", "title": "Lunch on your own", "location": ""},
        {"type": "session", "time": "1:30 p.m.", "title": "Technical Session II", "location": "UNKNOWN", "talks": [
            {
                "time": "1:30 p.m.", "title": "Development of a Miniature Dual Source Linear Ion Trap Mass Spectrometer for the ExoMars Rover Mission",
                "authors": [{"name": "William Brinckerhoff", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/monday after lunch session/4_Brinckerhoff.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Brinckerhoff_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Brinckerhoff_Development_of_a_Miniature_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Brinckerhoff_Development_of_a_Miniature_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Brinckerhoff_Development_of_a_Miniature_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Brinckerhoff_Development_of_a_Miniature_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Brinckerhoff_Development_of_a_Miniature_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Brinckerhoff_Development_of_a_Miniature_Abstract.pdf"
            },
            {
                "time": "2:00 p.m.", "title": "A Compact Two-step Laser Time-of-flight Mass Spectrometer for In Situ Analysis of Planetary Surfaces",
                "authors": [{"name": "Stephanie Getty", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Getty.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Getty_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Getty_A_Compact_Twostep_Laser_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Getty_A_Compact_Twostep_Laser_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Getty_A_Compact_Twostep_Laser_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Getty_A_Compact_Twostep_Laser_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Getty_A_Compact_Twostep_Laser_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Getty_A_Compact_Twostep_Laser_Abstract.pdf"
            },
            {
                "time": "2:30 p.m.", "title": "A Multiple-reflection Time-of-flight Mass Spectrometer for the ROSETTA Space Craft",
                "authors": [{"name": "Hermann Wollnik", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/monday after lunch session/6_Wollnik.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Wollnik_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Wollnik_A_Multiplereflection_Timeofflight_Mass_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Wollnik_A_Multiplereflection_Timeofflight_Mass_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Wollnik_A_Multiplereflection_Timeofflight_Mass_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Wollnik_A_Multiplereflection_Timeofflight_Mass_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Wollnik_A_Multiplereflection_Timeofflight_Mass_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Wollnik_A_Multiplereflection_Timeofflight_Mass_Abstract.pdf"
            },
            {
                "time": "3:00 p.m.", "title": "Cupid’s Arrow: An Innovative Nanosat Mass Spectrometer to Sample Venus’ Upper Atmosphere",
                "authors": [{"name": "Murray Darrach", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/monday after lunch session/7_Durrach.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Darrach_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Darrach_Cupids_Arrow_An_Innovative_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Darrach_Cupids_Arrow_An_Innovative_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Darrach_Cupids_Arrow_An_Innovative_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Darrach_Cupids_Arrow_An_Innovative_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Darrach_Cupids_Arrow_An_Innovative_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Darrach_Cupids_Arrow_An_Innovative_Abstract.pdf"
            },
            {
                "time": "3:30 p.m.", "title": "JPL Flyby Mass Spectrometer",
                "authors": [{"name": "Evan Neidtholdt", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Neidtholdt.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Neidholdt_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Neidtholdt_JPL_Flyby_Mass_Spectrometer_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_II/10th_Neidtholdt_JPL_Flyby_Mass_Spectrometer_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Neidtholdt_JPL_Flyby_Mass_Spectrometer_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Neidtholdt_JPL_Flyby_Mass_Spectrometer_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Neidtholdt_JPL_Flyby_Mass_Spectrometer_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_II/10th_Neidtholdt_JPL_Flyby_Mass_Spectrometer_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "4:00 p.m.", "title": "Poster Session", "location": "light refreshemnts served during poster session"},
        {"type": "event", "time": "7:00 p.m.", "title": "Evening Free", "location": ""}
    ],
    "2015-09-15": [
        {"type": "session", "time": "8:00 a.m.", "title": "Technical Session III", "location": "UNKNOWN", "talks": [
            {
                "time": "8:00 a.m.", "title": "Fast Pressure Prediction with a MEMS Pirani Sensor for Protection of MOMA-MS",
                "authors": [{"name": "Adrian Southard", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/9_Southard.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Southard_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Southard_Fast_Pressure_Prediction_with_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Southard_Fast_Pressure_Prediction_with_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Southard_Fast_Pressure_Prediction_with_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Southard_Fast_Pressure_Prediction_with_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Southard_Fast_Pressure_Prediction_with_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Southard_Fast_Pressure_Prediction_with_Abstract.pdf"
            },
            {
                "time": "8:30 a.m.", "title": "Miniaturized Planar Electrode Linear Ion Trap (LIT) Mass Analyzer",
                "authors": [{"name": "Ailin Li", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/10_Li.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Li_Ailin_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Li_Miniaturized_Planar_Electrode_Linear_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Li_Miniaturized_Planar_Electrode_Linear_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Li_Miniaturized_Planar_Electrode_Linear_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Li_Miniaturized_Planar_Electrode_Linear_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Li_Miniaturized_Planar_Electrode_Linear_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Li_Miniaturized_Planar_Electrode_Linear_Abstract.pdf"
            },
            {
                "time": "9:00 a.m.", "title": "Simulation Study for Tolerance of Six Degrees of Freedom in Two-plate Linear Ion Trap",
                "authors": [{"name": "Qinghao Wu", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/11_Wu.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Wu_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Wu_Simulation_Study_for_Tolerance_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Wu_Simulation_Study_for_Tolerance_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Wu_Simulation_Study_for_Tolerance_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Wu_Simulation_Study_for_Tolerance_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Wu_Simulation_Study_for_Tolerance_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Wu_Simulation_Study_for_Tolerance_Abstract.pdf"
            },
            {
                "time": "9:30 a.m.", "title": "Low Power Carbon Nanotube Field Emission Electron Source for Chemical Ionization Mass Spectrometry",
                "authors": [{"name": "Charles Parker", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/12_Parker.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Parker_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Parker_Low_Power_Carbon_Nanotube_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_III/10th_Parker_Low_Power_Carbon_Nanotube_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Parker_Low_Power_Carbon_Nanotube_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Parker_Low_Power_Carbon_Nanotube_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Parker_Low_Power_Carbon_Nanotube_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_III/10th_Parker_Low_Power_Carbon_Nanotube_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "10:00 a.m.", "title": "Mid-morning Break", "location": ""},
        {"type": "session", "time": "10:30 a.m.", "title": "Technical Session IV", "location": "UNKNOWN", "talks": [
            {
                "time": "10:30 a.m.", "title": "In-situ Volcanic Plume Monitoring at Solfatara Volcano and Vulcano Island, Italy with Small Portable Mass Spectrometer Systems designed for Field Deployment and Unmanned Aerial Vehicles (UAV)",
                "authors": [{"name": "Ken Wright", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/13_Wright.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Wright_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_IV/10th_Wright_Insitu_Volcanic_Plume_Monitoring_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_IV/10th_Wright_Insitu_Volcanic_Plume_Monitoring_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Wright_Insitu_Volcanic_Plume_Monitoring_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Wright_Insitu_Volcanic_Plume_Monitoring_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Wright_Insitu_Volcanic_Plume_Monitoring_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Wright_Insitu_Volcanic_Plume_Monitoring_Abstract.pdf"
            },
            {
                "time": "11:00 a.m.", "title": "A Hybrid Vehicle Mounted Membrane Inlet Mass Spectrometer for Spatial Analysis of Atmospheric Chemical Concerns",
                "authors": [{"name": "Guido Verbeck", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/14_Guido.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Verbeck_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_IV/10th_Verbeck_A_Hybrid_Vehicle_Mounted_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_IV/10th_Verbeck_A_Hybrid_Vehicle_Mounted_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Verbeck_A_Hybrid_Vehicle_Mounted_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Verbeck_A_Hybrid_Vehicle_Mounted_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Verbeck_A_Hybrid_Vehicle_Mounted_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Verbeck_A_Hybrid_Vehicle_Mounted_Abstract.pdf"
            },
            {
                "time": "11:30 a.m.", "title": "Use of a Field-portable GCMS in a Brewing Environment",
                "authors": [{"name": "Garth Patterson", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/tuesday morning session/15_PATTERSON.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Patterson_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_IV/10th_Patterson_Use_of_a_Fieldportable_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_IV/10th_Patterson_Use_of_a_Fieldportable_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Patterson_Use_of_a_Fieldportable_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Patterson_Use_of_a_Fieldportable_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Patterson_Use_of_a_Fieldportable_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_IV/10th_Patterson_Use_of_a_Fieldportable_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "12:00 p.m.", "title": "Group Photo & Lunch will be provided", "location": "classic sandwich tray"},
        {"type": "session", "time": "1:30 p.m.", "title": "Technical Session V", "location": "UNKNOWN", "talks": [
            {
                "time": "1:30 p.m.", "title": "Development of a Field Deployable Mass Spectrometer for Hydrological Applications",
                "authors": [{"name": "Hung Quang Hoang", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Tuesday afternoon/16_HOANG.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Hoang_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_V/10th_Hoang_Development_of_a_Field_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_V/10th_Hoang_Development_of_a_Field_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Hoang_Development_of_a_Field_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Hoang_Development_of_a_Field_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Hoang_Development_of_a_Field_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Hoang_Development_of_a_Field_Abstract.pdf"
            },
            {
                "time": "2:00 p.m.", "title": "In-water Mass Spectrometry for Characterization of Light Hydrocarbon Seeps and Leaks",
                "authors": [{"name": "Tim Short", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Tuesday afternoon/17_Short.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Short_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_V/10th_Short_Inwater_Mass_Spectrometry_for_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_V/10th_Short_Inwater_Mass_Spectrometry_for_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Short_Inwater_Mass_Spectrometry_for_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Short_Inwater_Mass_Spectrometry_for_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Short_Inwater_Mass_Spectrometry_for_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Short_Inwater_Mass_Spectrometry_for_Abstract.pdf"
            },
            {
                "time": "2:30 p.m.", "title": "Improvements in Under Water Mass Spectrometry",
                "authors": [{"name": "Torben Gentz", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Tuesday afternoon/18_Gentz.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Gentz_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_V/10th_Gentz_Improvements_in_Under_Water_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_V/10th_Gentz_Improvements_in_Under_Water_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Gentz_Improvements_in_Under_Water_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Gentz_Improvements_in_Under_Water_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Gentz_Improvements_in_Under_Water_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_V/10th_Gentz_Improvements_in_Under_Water_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "3:00 p.m.", "title": "Mid-Afternoon Break", "location": ""},
        {"type": "session", "time": "3:30 p.m.", "title": "Technical Session VI", "location": "UNKNOWN", "talks": [
            {
                "time": "3:30 p.m.", "title": "Broadband, Fully Automated Identification of Drugs Using a Field Deployable DART-ITMS",
                "authors": [{"name": "Berk Oktem", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Tuesday afternoon/19_Oktem.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Oktem_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_VI/10th_Oktem_Broadband_Fully_Automated_Identification_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VI/10th_Oktem_Broadband_Fully_Automated_Identification_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VI/10th_Oktem_Broadband_Fully_Automated_Identification_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VI/10th_Oktem_Broadband_Fully_Automated_Identification_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VI/10th_Oktem_Broadband_Fully_Automated_Identification_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VI/10th_Oktem_Broadband_Fully_Automated_Identification_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "7:00 p.m.", "title": "Workshop Dinner at the Rusty Scupper", "location": "http://www.rusty-scupper.com/"}
    ],
    "2015-09-16": [
        {"type": "session", "time": "8:00 a.m.", "title": "Technical Session VII", "location": "UNKNOWN", "talks": [
            {
                "time": "8:00 a.m.", "title": "The Spacecraft Atmosphere Monitor (S.A.M.) for ISS and Orion",
                "authors": [{"name": "Richard Kidd", "isPresenter": True}], "institutes": [],
                "legacy_url": "",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Kidd_talk.pdf",
                "local_target_path": "",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Kidd_The_Spacecraft_Atmosphere_Monitor_Abstract.pdf",
                "public_website_url": "",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Kidd_The_Spacecraft_Atmosphere_Monitor_Abstract.pdf",
                "gcloud_url": "",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Kidd_The_Spacecraft_Atmosphere_Monitor_Abstract.pdf"
            },
            {
                "time": "8:30 a.m.", "title": "Advanced Miniature Linear Ion Trap Mass Spectrometer for Space Applications",
                "authors": [{"name": "Andrej Grubisic", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Wednesday/21_Grubisic.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Grubisic_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Grubisic_Advanced_Miniature_Linear_Ion_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Grubisic_Advanced_Miniature_Linear_Ion_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Grubisic_Advanced_Miniature_Linear_Ion_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Grubisic_Advanced_Miniature_Linear_Ion_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Grubisic_Advanced_Miniature_Linear_Ion_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Grubisic_Advanced_Miniature_Linear_Ion_Abstract.pdf"
            },
            {
                "time": "9:00 a.m.", "title": "Towards Detection of Life in Space Exploration Missions by using a Miniature Laser Ablation Ionization Mass Spectrometer",
                "authors": [{"name": "Andreas Riedo", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Wednesday/22_Riedo.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Riedo_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Riedo_Towards_Detection_of_Life_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Riedo_Towards_Detection_of_Life_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Riedo_Towards_Detection_of_Life_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Riedo_Towards_Detection_of_Life_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Riedo_Towards_Detection_of_Life_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Riedo_Towards_Detection_of_Life_Abstract.pdf"
            },
            {
                "time": "9:30 a.m.", "title": "Development of Tandem Mass Spectrometry (MS/MS) on a Miniaturized Laser Desorption/Ionization Time-of-flight Mass Spectrometry (LD-TOF-MS)",
                "authors": [{"name": "Xiang Li", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Wednesday/23_Li.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Li_Xiang_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Li_Development_of_Tandem_Mass_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VII/10th_Li_Development_of_Tandem_Mass_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Li_Development_of_Tandem_Mass_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Li_Development_of_Tandem_Mass_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Li_Development_of_Tandem_Mass_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VII/10th_Li_Development_of_Tandem_Mass_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "10:00 a.m.", "title": "Mid-morning Break", "location": ""},
        {"type": "session", "time": "10:30 a.m.", "title": "Technical Session VIII", "location": "UNKNOWN", "talks": [
            {
                "time": "10:30 a.m.", "title": "The Fast Path of the Molecules: from the Engine Cylinder to Mass Spec and What this has to do with Lube Oil Consumption",
                "authors": [{"name": "Sven Krause", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Wednesday/24_Krause.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Krause_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_VIII/10th_Krause_The_Fast_Path_of_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VIII/10th_Krause_The_Fast_Path_of_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Krause_The_Fast_Path_of_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Krause_The_Fast_Path_of_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Krause_The_Fast_Path_of_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Krause_The_Fast_Path_of_Abstract.pdf"
            },
            {
                "time": "11:00 a.m.", "title": "Portable MS-UV Sensing Platform for Water Quality in Aquaculture",
                "authors": [{"name": "Stephen Taylor", "isPresenter": True}], "institutes": [],
                "legacy_url": "https://www.hems-workshop.org/10thWS/Talks/Wednesday/25_Taylor.pdf",
                "legacy_abstract_url": "https://www.hems-workshop.org/10thWS/Abstracts/Taylor_talk.pdf",
                "local_target_path": "/api/manager/serve?file=10th/Technical_Session_VIII/10th_Taylor_Portable_MSUV_Sensing_Platform_Presentation.pdf",
                "local_abstract_target_path": "/api/manager/serve?file=10th/Technical_Session_VIII/10th_Taylor_Portable_MSUV_Sensing_Platform_Abstract.pdf",
                "public_website_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Taylor_Portable_MSUV_Sensing_Platform_Presentation.pdf",
                "public_abstract_url": "https://storage.googleapis.com/hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Taylor_Portable_MSUV_Sensing_Platform_Abstract.pdf",
                "gcloud_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Taylor_Portable_MSUV_Sensing_Platform_Presentation.pdf",
                "gcloud_abstract_url": "gs://hems-workshop-archives/proceedings/10th/Technical_Session_VIII/10th_Taylor_Portable_MSUV_Sensing_Platform_Abstract.pdf"
            }
        ]},
        {"type": "event", "time": "11:30 a.m.", "title": "Program Survey and Closing Remarks", "location": ""}
    ]
}

for day, items in schedule_data.items():
    out["schedule"].append({
        "title": day,
        "items": items
    })

with open("src/frontend/src/data/archives/2015.json", "w") as f:
    json.dump(out, f, indent=2)

print("Created 2015.json")

