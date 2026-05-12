"use client";

import React, { useState, useEffect, useRef } from 'react';
import PresentationsManager from './components/PresentationsManager';
import SponsorsManager from './components/SponsorsManager';

import StudentsManager from './components/StudentsManager';
import PostersManager from './components/PostersManager';
import EventsManager from './components/EventsManager';
import PreviewHover from './components/PreviewHover';
import DragDropZone from './components/DragDropZone';
import { exportProgramPdf } from './utils/exportProgramPdf';

export default function WorkshopManager() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [logs, setLogs] = useState('');
  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, string>>({});

  const latestWorkshops = useRef(workshops);
  useEffect(() => {
    latestWorkshops.current = workshops;
  }, [workshops]);

  const handleAdminPasteDownload = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
    field: 'program_url' | 'participant_list_url',
    fileName: string
  ) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.startsWith('http')) return;

    e.preventDefault();

    // Update item immediately
    const updated = [...latestWorkshops.current];
    updated[index] = { ...updated[index], [field]: pastedText };
    setWorkshops(updated);

    const statusKey = `${index}-${field}`;
    setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'downloading' }));

    try {
      const res = await fetch('/api/manager/download-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pastedText,
          category: 'Administrative',
          wsNum: String(updated[index].number),
          fileName,
          session: 'Administrative'
        })
      });
      const data = await res.json();
      if (data.success) {
        // Save the filename to the state so it can be built into a cloud URL
        const successUpdate = [...latestWorkshops.current];
        const fileField = field === 'program_url' ? 'program_file' : 'participant_list_file';
        successUpdate[index] = { ...successUpdate[index], [fileField]: fileName };
        setWorkshops(successUpdate);

        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        setTimeout(() => setDownloadingStatus(prev => ({ ...prev, [statusKey]: '' })), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'error' }));
      setTimeout(() => setDownloadingStatus(prev => ({ ...prev, [statusKey]: '' })), 3000);
    }
  };

  // Fetch initial data
  useEffect(() => {
    // In a real scenario, we'd fetch from a GET api, but to keep it simple
    // we can use dynamic import or just start with an empty array if not fetched.
    fetch('/api/manager/workshops?v=2')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setWorkshops(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: If GET route doesn't exist, start empty
        setWorkshops([]);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/manager/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workshops),
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Saved locally!');
      if (selectedIdx >= 0 && workshops[selectedIdx]) {
        window.open(`http://localhost:3000/archive/${workshops[selectedIdx].year}`, '_blank');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  const handlePushToLive = async () => {
    const customMessage = window.prompt("Enter an optional commit message (leave blank for auto-generation based on changed files):");
    if (customMessage === null) return; // User cancelled

    setPushing(true);
    try {
      const res = await fetch('/api/manager/push-to-live', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: customMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push to Live failed');
      setLogs((data.gcloudLog || '') + '\n' + (data.message || ''));
      alert('Pushed to Live successfully!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setPushing(false);
  };
  const handleAdminDeleteFile = async (field: string, category: string, session: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      const res = await fetch('/api/manager/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, category, wsNum: workshops[selectedIdx].number, session })
      });
      const data = await res.json();
      if (data.success) {
        const updated = [...workshops];
        if (field.includes('.')) {
           const [parent, child] = field.split('.');
           (updated[selectedIdx] as any)[parent][child] = "";
        } else {
           (updated[selectedIdx] as any)[field] = "";
        }
        setWorkshops(updated);
      } else {
        alert('Error deleting file: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting file: ' + err.message);
    }
  };

  const addWorkshop = () => {
    const newWs = {
      number: workshops.length + 1,
      year: new Date().getFullYear(),
      venue: '',
      address: '',
      city: '',
      dates: '',
      presentations: [],
      sponsors: [],
      student_awards: [],
      posters: [],
      events: [],
    };
    setWorkshops([...workshops, newWs]);
    setSelectedIdx(workshops.length);
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  const currentWs = selectedIdx >= 0 ? workshops[selectedIdx] : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      <div className="sticky top-0 z-50 bg-slate-900 flex justify-between items-center mb-8 border-b border-slate-700 pb-4 pt-4">
        <h1 className="text-3xl font-bold text-sky-400">🛠️ Workshop Manager</h1>
        <div className="space-x-4 flex items-center">
          {currentWs && (
            <button
              onClick={() => {
                const pages = exportProgramPdf(currentWs);
                if (pages > 3) alert(`PDF generated with ${pages} pages. The schedule exceeded the 2-page target — consider reducing content or splitting sessions.`);
              }}
              className="bg-violet-700 hover:bg-violet-600 text-white px-4 py-2 rounded font-bold transition-colors flex items-center gap-1.5"
              title="Export a formatted Technical Program PDF for this workshop"
            >
              📄 Export PDF
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving || pushing}
            className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save and Present on Local Host'}
          </button>
          <button 
            onClick={handlePushToLive}
            disabled={saving || pushing}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
          >
            {pushing ? 'Running...' : '🚀 Push to Live'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8 items-start">
        <div className="col-span-1 bg-slate-800 p-4 rounded border border-slate-700 sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-sky-400">Workshops</h2>
          <ul className="space-y-2">
            {workshops.map((ws, i) => (
              <li 
                key={i} 
                className={`p-2 cursor-pointer rounded ${selectedIdx === i ? 'bg-sky-900 text-sky-100' : 'hover:bg-slate-700'}`}
                onClick={() => setSelectedIdx(i)}
              >
                {ws.number}th Workshop ({ws.year})
              </li>
            ))}
          </ul>
            <button 
              onClick={addWorkshop}
              className="mt-4 w-full bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm shrink-0"
            >
              + Add Workshop
            </button>
        </div>

        <div className="col-span-3 bg-slate-800 p-6 rounded border border-slate-700">
          {!currentWs ? (
            <p className="text-slate-400">Select a workshop to edit.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-sky-400">Workshop Level Input</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Number</label>
                  <input 
                    type="number" 
                    value={currentWs.number} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].number = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Year</label>
                  <input 
                    type="number" 
                    value={currentWs.year} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].year = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Dates</label>
                  <input 
                    type="text" 
                    value={currentWs.dates || ''} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].dates = e.target.value;
                      setWorkshops(updated);
                    }}
                    placeholder="e.g. October 1-4, 2024"
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">City</label>
                  <input 
                    type="text" 
                    value={currentWs.city} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].city = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Venue Name</label>
                  <input 
                    type="text" 
                    value={currentWs.venue} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].venue = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Venue Address</label>
                  <input 
                    type="text" 
                    value={currentWs.address || ''} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].address = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Venue URL <span className="text-xs font-normal">(Link to Venue Webpage)</span></label>
                  <input 
                    type="url" 
                    value={currentWs.venue_url || ''} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].venue_url = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Venue Address URL <span className="text-xs font-normal">(Link to Google Maps)</span></label>
                  <input 
                    type="url" 
                    value={currentWs.venue_address_url || ''} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].venue_address_url = e.target.value;
                      setWorkshops(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-400 mb-1">Legacy Program URL</label>
                  <input 
                    type="url" 
                    value={currentWs.program_url || ''} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].program_url = e.target.value;
                      setWorkshops(updated);
                    }}
                    onPaste={e => handleAdminPasteDownload(e, selectedIdx, 'program_url', `${currentWs.number}th_Program.pdf`)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${selectedIdx}-program_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${selectedIdx}-program_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${selectedIdx}-program_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-white transition-colors mb-2`} 
                  />
                  {downloadingStatus[`${selectedIdx}-program_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                  
                  <DragDropZone 
                    label="Drop Program PDF" 
                    category="Administrative" 
                    wsNum={String(currentWs.number)} 
                    fileName={`${currentWs.number}th_Program.pdf`}
                    session="Administrative"
                    title="Workshop Program"
                    onSuccess={() => {
                      const updated = [...workshops];
                      updated[selectedIdx].program_file = `${currentWs.number}th_Program.pdf`;
                      setWorkshops(updated);
                    }}
                  />

                  <div className="mt-3 text-xs text-slate-400 flex flex-col gap-1 p-2 bg-slate-950/50 rounded border border-slate-700/50">
                    <span className="flex items-center gap-2">
                      <strong>Preview:</strong> 
                      {currentWs.program_file ? (
                        <div className="flex items-center gap-1 group">
                          <PreviewHover fileName={currentWs.program_file} wsNum={currentWs.number.toString()} session="Administrative" title="Workshop Program" />
                          <button onClick={() => handleAdminDeleteFile('program_file', 'Administrative', 'Administrative', currentWs.program_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">(Requires uploaded file)</span>
                      )}
                    </span>
                    {currentWs.program_file && (
                      <>
                        <span><strong>Local:</strong> docs/archives_translation/proceedings/{currentWs.number}th/Administrative/{currentWs.program_file}</span>
                        <span><strong>GCloud:</strong> gs://hems-workshop-archives/proceedings/{currentWs.number}th/Administrative/{currentWs.program_file}</span>
                        <span className="break-all"><strong>Public (Firebase):</strong> https://storage.googleapis.com/hems-workshop-archives/proceedings/{currentWs.number}th/Administrative/{currentWs.program_file}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-400 mb-1">Legacy Participant List URL</label>
                  <input 
                    type="url" 
                    value={currentWs.participant_list_url || ''} 
                    onChange={(e) => {
                      const updated = [...workshops];
                      updated[selectedIdx].participant_list_url = e.target.value;
                      setWorkshops(updated);
                    }}
                    onPaste={e => handleAdminPasteDownload(e, selectedIdx, 'participant_list_url', `${currentWs.number}th_Participant_List.pdf`)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${selectedIdx}-participant_list_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${selectedIdx}-participant_list_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${selectedIdx}-participant_list_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-white transition-colors mb-2`} 
                  />
                  {downloadingStatus[`${selectedIdx}-participant_list_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                  
                  <DragDropZone 
                    label="Drop Participant List PDF" 
                    category="Administrative" 
                    wsNum={String(currentWs.number)} 
                    fileName={`${currentWs.number}th_Participant_List.pdf`}
                    session="Administrative"
                    title="Participant List"
                    onSuccess={() => {
                      const updated = [...workshops];
                      updated[selectedIdx].participant_list_file = `${currentWs.number}th_Participant_List.pdf`;
                      setWorkshops(updated);
                    }}
                  />

                  <div className="mt-3 text-xs text-slate-400 flex flex-col gap-1 p-2 bg-slate-950/50 rounded border border-slate-700/50">
                    <span className="flex items-center gap-2">
                      <strong>Preview:</strong> 
                      {currentWs.participant_list_file ? (
                        <div className="flex items-center gap-1 group">
                          <PreviewHover fileName={currentWs.participant_list_file} wsNum={currentWs.number.toString()} session="Administrative" title="Participant List" />
                          <button onClick={() => handleAdminDeleteFile('participant_list_file', 'Administrative', 'Administrative', currentWs.participant_list_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">(Requires uploaded file)</span>
                      )}
                    </span>
                    {currentWs.participant_list_file && (
                      <>
                        <span><strong>Local:</strong> docs/archives_translation/proceedings/{currentWs.number}th/Administrative/{currentWs.participant_list_file}</span>
                        <span><strong>GCloud:</strong> gs://hems-workshop-archives/proceedings/{currentWs.number}th/Administrative/{currentWs.participant_list_file}</span>
                        <span className="break-all"><strong>Public (Firebase):</strong> https://storage.googleapis.com/hems-workshop-archives/proceedings/{currentWs.number}th/Administrative/{currentWs.participant_list_file}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>


              
              <SponsorsManager 
                sponsors={currentWs.sponsors || []} 
                wsNum={String(currentWs.number)}
                onChange={(newData) => {
                  const updated = [...workshops];
                  updated[selectedIdx].sponsors = newData;
                  setWorkshops(updated);
                }}
              />
              <div className="space-y-12 mt-8">
                <EventsManager 
                  events={currentWs.events || []} 
                  onChange={(newData) => {
                    const updated = [...workshops];
                    updated[selectedIdx].events = newData;
                    setWorkshops(updated);
                  }}
                />

                <PresentationsManager 
                  presentation_sessions={currentWs.presentation_sessions || []} 
                  wsNum={String(currentWs.number)}
                  onChange={(newData) => {
                    const updated = [...workshops];
                    updated[selectedIdx].presentation_sessions = newData;
                    setWorkshops(updated);
                  }}
                />


                <StudentsManager 
                  students={currentWs.student_awards || []} 
                  wsNum={String(currentWs.number)}
                  onChange={(newData) => {
                    const updated = [...workshops];
                    updated[selectedIdx].student_awards = newData;
                    setWorkshops(updated);
                  }}
                />

                <PostersManager 
                  posters={currentWs.posters || []} 
                  wsNum={String(currentWs.number)}
                  onChange={(newData) => {
                    const updated = [...workshops];
                    updated[selectedIdx].posters = newData;
                    setWorkshops(updated);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {logs && (
        <div className="mt-8 bg-black p-4 rounded font-mono text-sm text-green-400 overflow-x-auto whitespace-pre">
          {logs}
        </div>
      )}
    </div>
  );
}
