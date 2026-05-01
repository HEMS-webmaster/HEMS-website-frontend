"use client";

import React, { useState, useRef, useEffect } from 'react';
import DragDropZone from './DragDropZone';
import PreviewHover from './PreviewHover';

export interface Author {
  name: string;
  isPresenter: boolean;
  institute?: string | null;
}

interface Presentation {
  time: string;
  title: string;
  authors: Author[];
  institutes?: string[];
  url: string;
  abstract_url?: string;
  presentation_file?: string;
  abstract_file?: string;
}

export interface PresentationSession {
  date: string;
  title: string;
  location: string;
  presentations: Presentation[];
}

interface PresentationsManagerProps {
  presentation_sessions: PresentationSession[];
  wsNum: string;
  onChange: (sessions: PresentationSession[]) => void;
}

/** Extract institute from comma-delimited author name and return {name, institute} */
function extractAuthorParts(rawName: string): { name: string; institute: string | null } {
  const commaIdx = rawName.indexOf(',');
  if (commaIdx === -1) return { name: rawName.trim(), institute: null };
  return {
    name: rawName.slice(0, commaIdx).trim(),
    institute: rawName.slice(commaIdx + 1).trim() || null,
  };
}

export default function PresentationsManager({ presentation_sessions = [], wsNum, onChange }: PresentationsManagerProps) {
  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, string>>({});
  const migrated = useRef(false);

  // One-time auto-extraction: split "Name, Institute" into separate fields
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;

    let needsUpdate = false;
    const updated = presentation_sessions.map(session => ({
      ...session,
      presentations: session.presentations.map(pres => {
        const institutes: string[] = [...(pres.institutes || [])];
        const newAuthors = (pres.authors || []).map(author => {
          // Already has explicit institute field — skip
          if (author.institute !== undefined) return author;
          const { name, institute } = extractAuthorParts(author.name);
          if (institute) {
            needsUpdate = true;
            if (!institutes.includes(institute)) institutes.push(institute);
            return { ...author, name, institute };
          }
          return { ...author, institute: null };
        });
        return { ...pres, authors: newAuthors, institutes };
      }),
    }));

    if (needsUpdate) onChange(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasteDownload = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    gIdx: number,
    pIdx: number,
    field: 'url' | 'abstract_url',
    category: string,
    fileName: string,
    sessionTitle: string
  ) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.startsWith('http')) return;

    e.preventDefault();
    updatePresentation(gIdx, pIdx, field, pastedText);

    const statusKey = `${gIdx}-${pIdx}-${field}`;
    setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'downloading' }));

    try {
      const res = await fetch('/api/manager/download-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pastedText, category, wsNum, fileName, session: sessionTitle })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        if (field === 'url') {
          updatePresentation(gIdx, pIdx, 'presentation_file', fileName);
        } else {
          updatePresentation(gIdx, pIdx, 'abstract_file', fileName);
        }
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

  const latestSessions = useRef(presentation_sessions);
  useEffect(() => {
    latestSessions.current = presentation_sessions;
  }, [presentation_sessions]);

  // Group functions
  const addGroup = () => {
    onChange([...presentation_sessions, { date: '', title: '', location: '', presentations: [] }]);
  };

  const removeGroup = (gIdx: number) => {
    const updated = [...presentation_sessions];
    updated.splice(gIdx, 1);
    onChange(updated);
  };

  const updateGroup = (gIdx: number, field: keyof PresentationSession, value: string) => {
    const updated = [...latestSessions.current];
    updated[gIdx] = { ...updated[gIdx], [field]: value };
    onChange(updated);
  };

  const sortChronologically = () => {
    const sorted = [...latestSessions.current].sort((a, b) => {
      // Primary: sort by date
      const dateA = a.date ? new Date(a.date).getTime() : Infinity;
      const dateB = b.date ? new Date(b.date).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      // Secondary: sort by first presentation time within same date
      const timeA = (a.presentations?.[0]?.time || '').trim();
      const timeB = (b.presentations?.[0]?.time || '').trim();
      return timeA.localeCompare(timeB);
    });
    onChange(sorted);
  };

  // Presentation functions
  const addPresentation = (gIdx: number) => {
    const updated = [...presentation_sessions];
    updated[gIdx].presentations.push({
      time: '', title: '', authors: [], institutes: [], url: ''
    });
    onChange(updated);
  };

  const updatePresentation = (gIdx: number, pIdx: number, field: keyof Presentation, value: any) => {
    const updated = [...latestSessions.current];
    updated[gIdx].presentations[pIdx] = { ...updated[gIdx].presentations[pIdx], [field]: value };
    onChange(updated);
  };

  const removePresentation = (gIdx: number, pIdx: number) => {
    const updated = [...presentation_sessions];
    updated[gIdx].presentations.splice(pIdx, 1);
    onChange(updated);
  };

  const movePresentation = (fromGIdx: number, pIdx: number, toGIdx: number) => {
    if (fromGIdx === toGIdx) return;
    const updated = [...presentation_sessions];
    const presToMove = { ...updated[fromGIdx].presentations[pIdx] };
    updated[fromGIdx].presentations.splice(pIdx, 1);
    if (!updated[toGIdx].presentations) updated[toGIdx].presentations = [];
    updated[toGIdx].presentations.push(presToMove);
    updated[toGIdx].presentations.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    onChange(updated);
  };

  const handleDeleteFile = async (gIdx: number, pIdx: number, field: keyof Presentation, category: string, sessionTitle: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      const res = await fetch('/api/manager/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, category, wsNum, session: sessionTitle })
      });
      const data = await res.json();
      if (data.success) {
        updatePresentation(gIdx, pIdx, field, "");
      } else {
        alert('Error deleting file: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting file: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Oral Presentations</h3>
        <button
          onClick={sortChronologically}
          className="bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded text-sm text-slate-200"
          title="Sort session groups by date then time"
        >
          ↕ Sort Chronologically
        </button>
      </div>

      {(presentation_sessions || []).map((group, gIdx) => (
        <div key={gIdx} className="bg-slate-800 p-4 rounded border border-slate-700 relative">
          <button 
            onClick={() => removeGroup(gIdx)} 
            className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold px-2"
            title="Remove Session Group"
          >
            ✕
          </button>
          
          <div className="grid grid-cols-3 gap-4 mb-6 border-b border-slate-700 pb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Session Date (e.g. mm/dd/yyyy)</label>
              <input type="date" value={group.date || ''} onChange={e => updateGroup(gIdx, 'date', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Session Title</label>
              <input type="text" value={group.title || ''} placeholder="e.g. Technical Session I" onChange={e => updateGroup(gIdx, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Location (Optional)</label>
              <input type="text" value={group.location || ''} placeholder="e.g. Mercury Room" onChange={e => updateGroup(gIdx, 'location', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
            </div>
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-slate-700">
            <h4 className="text-sm font-bold text-slate-300 mb-3">Presentations in {group.title || 'Unspecified Session'}</h4>

            {(group.presentations || []).map((p, pIdx) => {
              const institutes: string[] = p.institutes || [];

              let presenterName = `Author_${pIdx}`;
              if (p.authors && p.authors.length > 0) {
                const presenter = p.authors.find(a => a.isPresenter) || p.authors[0];
                const namePart = presenter.name.split(',')[0].trim();
                const nameWords = namePart.split(' ');
                presenterName = nameWords[nameWords.length - 1].replace(/[^a-zA-Z0-9]/g, '');
              }

              let titleSnippet = `Talk_${pIdx}`;
              if (p.title) {
                const words = p.title.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
                if (words.length > 0) titleSnippet = words.slice(0, 3).join('_');
              }

              const presFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Presentation.pdf`;
              const absFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Abstract.pdf`;

              return (
                <div key={pIdx} className={`p-4 rounded border border-slate-600 relative mt-4 ${pIdx % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900/80'}`}>
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {presentation_sessions.length > 1 && (
                      <select 
                        className="bg-slate-800 text-xs text-slate-300 border border-slate-600 rounded px-1 py-0.5 outline-none focus:border-sky-500"
                        value=""
                        onChange={(e) => movePresentation(gIdx, pIdx, parseInt(e.target.value))}
                      >
                        <option value="" disabled>Move to session...</option>
                        {presentation_sessions.map((targetGroup, tIdx) => (
                          tIdx !== gIdx && <option key={tIdx} value={tIdx}>{targetGroup.title || `Session ${tIdx + 1}`}</option>
                        ))}
                      </select>
                    )}
                    <button 
                      onClick={() => removePresentation(gIdx, pIdx)} 
                      className="text-red-400 hover:text-red-300 font-bold px-2"
                      title="Remove Presentation"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Time</label>
                      <input type="text" value={p.time || ''} placeholder="e.g. 9:00 a.m." onChange={e => updatePresentation(gIdx, pIdx, 'time', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                      <input type="text" value={p.title || ''} onChange={e => updatePresentation(gIdx, pIdx, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                    </div>
                  </div>

                  {/* ── Institute List ─────────────────────────────────────── */}
                  <div className="mb-3 p-2 bg-slate-800/60 rounded border border-slate-700">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-amber-400">Institutes</label>
                      <button
                        onClick={() => {
                          const updated = [...institutes, ''];
                          updatePresentation(gIdx, pIdx, 'institutes', updated);
                        }}
                        className="text-[10px] bg-amber-700/40 hover:bg-amber-700/60 text-amber-300 px-2 py-0.5 rounded"
                      >
                        + Add Institute
                      </button>
                    </div>
                    {institutes.length === 0 && (
                      <p className="text-[10px] text-slate-500 italic">No institutes defined. Add one above.</p>
                    )}
                    <div className="space-y-1">
                      {institutes.map((inst, iIdx) => (
                        <div key={iIdx} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={inst}
                            placeholder="e.g. University of Texas"
                            onChange={e => {
                              const oldName = institutes[iIdx];
                              const newName = e.target.value;
                              const updatedInstitutes = [...institutes];
                              updatedInstitutes[iIdx] = newName;
                              // Update authors that referenced old name
                              const updatedAuthors = p.authors.map(a =>
                                a.institute === oldName ? { ...a, institute: newName } : a
                              );
                              const updatedPres = {
                                ...latestSessions.current[gIdx].presentations[pIdx],
                                institutes: updatedInstitutes,
                                authors: updatedAuthors,
                              };
                              const updatedSessions = [...latestSessions.current];
                              updatedSessions[gIdx] = {
                                ...updatedSessions[gIdx],
                                presentations: updatedSessions[gIdx].presentations.map((pr, idx) =>
                                  idx === pIdx ? updatedPres : pr
                                ),
                              };
                              onChange(updatedSessions);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded p-1 text-xs text-white"
                          />
                          <button
                            onClick={() => {
                              const removedInst = institutes[iIdx];
                              const updatedInstitutes = [...institutes];
                              updatedInstitutes.splice(iIdx, 1);
                              // Null out references to this institute
                              const updatedAuthors = p.authors.map(a =>
                                a.institute === removedInst ? { ...a, institute: null } : a
                              );
                              const updatedPres = {
                                ...latestSessions.current[gIdx].presentations[pIdx],
                                institutes: updatedInstitutes,
                                authors: updatedAuthors,
                              };
                              const updatedSessions = [...latestSessions.current];
                              updatedSessions[gIdx] = {
                                ...updatedSessions[gIdx],
                                presentations: updatedSessions[gIdx].presentations.map((pr, idx) =>
                                  idx === pIdx ? updatedPres : pr
                                ),
                              };
                              onChange(updatedSessions);
                            }}
                            className="text-red-400 hover:text-red-300 font-bold text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Authors ───────────────────────────────────────────── */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 mb-1 flex justify-between items-end">
                      <span>Authors (Select Presenter)</span>
                      <button onClick={() => {
                        const updatedAuthors = [...(p.authors || [])];
                        updatedAuthors.push({ name: '', isPresenter: updatedAuthors.length === 0, institute: null });
                        updatePresentation(gIdx, pIdx, 'authors', updatedAuthors);
                      }} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded hover:bg-slate-600">+ Add Author</button>
                    </label>
                    <div className="space-y-2">
                      {(p.authors || []).map((author, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name={`pres-${gIdx}-presenter-${pIdx}`} 
                            checked={author.isPresenter} 
                            onChange={() => {
                              const updatedAuthors = (p.authors || []).map((a, idx) => ({
                                ...a,
                                isPresenter: idx === aIdx
                              }));
                              updatePresentation(gIdx, pIdx, 'authors', updatedAuthors);
                            }}
                            className="cursor-pointer w-4 h-4 text-sky-500 flex-shrink-0"
                            title="Mark as Presenting Author"
                          />
                          <input 
                            type="text" 
                            value={author.name || ''} 
                            placeholder="Author Name"
                            onChange={e => {
                              const updatedAuthors = [...(p.authors || [])];
                              updatedAuthors[aIdx] = { ...updatedAuthors[aIdx], name: e.target.value };
                              updatePresentation(gIdx, pIdx, 'authors', updatedAuthors);
                            }} 
                            className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" 
                          />
                          {/* Institute dropdown */}
                          <select
                            value={author.institute || ''}
                            onChange={e => {
                              const updatedAuthors = [...(p.authors || [])];
                              updatedAuthors[aIdx] = { ...updatedAuthors[aIdx], institute: e.target.value || null };
                              updatePresentation(gIdx, pIdx, 'authors', updatedAuthors);
                            }}
                            className="bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-300 outline-none focus:border-amber-500 max-w-[160px]"
                            title="Assign Institute"
                          >
                            <option value="">— no institute —</option>
                            {institutes.map((inst, iIdx) => (
                              <option key={iIdx} value={inst}>{inst || `Institute ${iIdx + 1}`}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const updatedAuthors = [...(p.authors || [])];
                              updatedAuthors.splice(aIdx, 1);
                              if (author.isPresenter && updatedAuthors.length > 0) {
                                updatedAuthors[0].isPresenter = true;
                              }
                              updatePresentation(gIdx, pIdx, 'authors', updatedAuthors);
                            }}
                            className="text-red-400 hover:text-red-300 font-bold px-2 flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Presentation URL</label>
                      <input 
                        type="url" 
                        value={p.url || ''} 
                        onChange={e => updatePresentation(gIdx, pIdx, 'url', e.target.value)} 
                        onPaste={e => handlePasteDownload(e, gIdx, pIdx, 'url', 'Presentation', presFileName, group.title || 'General')}
                        className={`w-full bg-slate-900 border ${downloadingStatus[`${gIdx}-${pIdx}-url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${gIdx}-${pIdx}-url`] === 'success' ? 'border-green-500' : downloadingStatus[`${gIdx}-${pIdx}-url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                      />
                      {downloadingStatus[`${gIdx}-${pIdx}-url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Abstract URL</label>
                      <input 
                        type="url" 
                        value={p.abstract_url || ''} 
                        onChange={e => updatePresentation(gIdx, pIdx, 'abstract_url', e.target.value)} 
                        onPaste={e => handlePasteDownload(e, gIdx, pIdx, 'abstract_url', 'Abstract', absFileName, group.title || 'General')}
                        className={`w-full bg-slate-900 border ${downloadingStatus[`${gIdx}-${pIdx}-abstract_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${gIdx}-${pIdx}-abstract_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${gIdx}-${pIdx}-abstract_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                      />
                      {downloadingStatus[`${gIdx}-${pIdx}-abstract_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DragDropZone 
                      label={`Drop Presentation PDF`} 
                      category="Presentation" 
                      wsNum={wsNum} 
                      fileName={presFileName}
                      session={group.title || 'General'}
                      title={p.title}
                      onSuccess={(path) => updatePresentation(gIdx, pIdx, 'presentation_file', presFileName)}
                    />
                    <DragDropZone 
                      label={`Drop Abstract PDF`} 
                      category="Abstract" 
                      wsNum={wsNum} 
                      fileName={absFileName}
                      session={group.title || 'General'}
                      title={p.title}
                      onSuccess={(path) => updatePresentation(gIdx, pIdx, 'abstract_file', absFileName)}
                    />
                  </div>
                  {(p.presentation_file || p.abstract_file) && (
                     <div className="mt-3 text-xs text-green-400 flex items-center gap-2 flex-wrap">
                       Attached: 
                       {p.presentation_file && (
                         <div className="flex items-center gap-1 group">
                           <PreviewHover fileName={p.presentation_file} wsNum={wsNum} session={group.title || 'General'} title={p.title} />
                           <button onClick={() => handleDeleteFile(gIdx, pIdx, 'presentation_file', 'Presentation', group.title || 'General', p.presentation_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                         </div>
                       )}
                       {p.presentation_file && p.abstract_file && <span className="text-slate-500">|</span>}
                       {p.abstract_file && (
                         <div className="flex items-center gap-1 group">
                           <PreviewHover fileName={p.abstract_file} wsNum={wsNum} session={group.title || 'General'} title={p.title + ' (Abstract)'} />
                           <button onClick={() => handleDeleteFile(gIdx, pIdx, 'abstract_file', 'Abstract', group.title || 'General', p.abstract_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                         </div>
                       )}
                     </div>
                  )}
                </div>
              );
            })}
              {/* Add Presentation — bottom of session group */}
              <button
                onClick={() => addPresentation(gIdx)}
                className="w-full mt-3 py-2 rounded-lg border-2 border-dashed border-sky-600/50 text-sky-400 hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-300 font-bold text-xs transition-all"
              >
                ＋ Add Presentation
              </button>
          </div>
        </div>
      ))}

      {/* Add Session Group — bottom of list */}
      <button
        onClick={addGroup}
        className="w-full mt-2 py-3 rounded-lg border-2 border-dashed border-primary/50 text-sky-400 hover:border-primary hover:bg-primary/10 hover:text-sky-300 font-bold text-sm transition-all"
      >
        ＋ Add Session Group
      </button>
    </div>
  );
}
