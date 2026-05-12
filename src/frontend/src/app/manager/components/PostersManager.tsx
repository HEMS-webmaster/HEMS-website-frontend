"use client";

import React, { useState, useRef, useEffect } from 'react';
import DragDropZone from './DragDropZone';
import PreviewHover from './PreviewHover';

import { Author } from './PresentationsManager';

interface Poster {
  title: string;
  authors: Author[];
  institutes?: string[];
  legacy_url: string;
  date?: string;
  time?: string;
  session?: string;
  legacy_abstract_url?: string;
  poster_file?: string;
  abstract_file?: string;
}

interface PostersManagerProps {
  posters: Poster[];
  wsNum: string;
  onChange: (posters: Poster[]) => void;
}

function extractAuthorParts(rawName: string): { name: string; institute: string | null } {
  const commaIdx = rawName.indexOf(',');
  if (commaIdx === -1) return { name: rawName.trim(), institute: null };
  return {
    name: rawName.slice(0, commaIdx).trim(),
    institute: rawName.slice(commaIdx + 1).trim() || null,
  };
}

export default function PostersManager({ posters = [], wsNum, onChange }: PostersManagerProps) {
  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, string>>({});
  const [postersDownloadStatus, setPostersDownloadStatus] = useState<{ total: number; done: number; errors: number; running: boolean } | null>(null);
  const migrated = useRef(false);

  // One-time auto-extraction: split "Name, Institute" into separate fields
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;

    let needsUpdate = false;
    const updated = posters.map(poster => {
      const institutes: string[] = [...(poster.institutes || [])];
      const newAuthors = poster.authors.map(author => {
        if (author.institute !== undefined) return author;
        const { name, institute } = extractAuthorParts(author.name);
        if (institute) {
          needsUpdate = true;
          if (!institutes.includes(institute)) institutes.push(institute);
          return { ...author, name, institute };
        }
        return { ...author, institute: null };
      });
      return { ...poster, authors: newAuthors, institutes };
    });

    if (needsUpdate) onChange(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  const handleUrlBlur = async (
    urlText: string,
    index: number,
    field: 'legacy_url' | 'legacy_abstract_url',
    category: string,
    fileName: string
  ) => {
    if (!urlText || !urlText.startsWith('http')) return;
    
    // Prevent redundant downloads if it's already success
    const statusKey = `${index}-${field}`;
    if (downloadingStatus[statusKey] === 'success' || downloadingStatus[statusKey] === 'downloading') return;

    setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'downloading' }));

    try {
      const res = await fetch('/api/manager/download-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlText, category, wsNum, fileName, session: 'Posters' })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        if (field === 'legacy_url') {
          updateItem(index, 'poster_file', fileName);
        } else {
          updateItem(index, 'abstract_file', fileName);
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

const handlePasteDownload = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
    field: 'legacy_url' | 'legacy_abstract_url',
    category: string,
    fileName: string
  ) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.startsWith('http')) return;

    e.preventDefault();
    updateItem(index, field, pastedText);

    const statusKey = `${index}-${field}`;
    setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'downloading' }));

    try {
      const res = await fetch('/api/manager/download-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pastedText, category, wsNum, fileName, session: 'Posters' })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        if (field === 'legacy_url') {
          updateItem(index, 'poster_file', fileName);
        } else {
          updateItem(index, 'abstract_file', fileName);
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

  const latestPosters = useRef(posters);
  useEffect(() => {
    latestPosters.current = posters;
  }, [posters]);

  const updateItem = (index: number, field: keyof Poster, value: any) => {
    const updated = [...latestPosters.current];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addItem = () => {
    onChange([...posters, { title: '', authors: [], institutes: [], legacy_url: '', date: '', time: '', session: '' }]);
  };

  const removeItem = (index: number) => {
    const updated = [...posters];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleDeleteFile = async (index: number, field: keyof Poster, category: string, session: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      const res = await fetch('/api/manager/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, category, wsNum, session })
      });
      const data = await res.json();
      if (data.success) {
        updateItem(index, field, "");
      } else {
        alert('Error deleting file: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting file: ' + err.message);
    }
  };


  const redownloadAllPosters = async () => {
    if (!latestPosters.current?.length) return;
    if (!confirm('Re-download all posters and abstracts from legacy URLs?\n\nThis will overwrite existing files.')) return;

    const jobs: { pIdx: number; field: 'legacy_url' | 'legacy_abstract_url'; category: string; fileName: string }[] = [];

    latestPosters.current.forEach((p, pIdx) => {
      let presenterName = `Poster_${pIdx}`;
      if (p.authors && p.authors.length > 0) {
        const presenter = p.authors.find(a => a.isPresenter) || p.authors[0];
        const namePart = presenter.name.split(',')[0].trim();
        const nameWords = namePart.split(' ');
        presenterName = nameWords[nameWords.length - 1].replace(/[^a-zA-Z0-9]/g, '');
      }
      let titleSnippet = `Topic_${pIdx}`;
      if (p.title) {
        const words = p.title.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
        if (words.length > 0) titleSnippet = words.slice(0, 3).join('_');
      }
      const posterFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Poster.pdf`;
      const abstractFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Abstract.pdf`;

      if (p.legacy_url && p.legacy_url.startsWith('http')) {
        jobs.push({ pIdx, field: 'legacy_url', category: 'Poster', fileName: posterFileName });
      }
      if (p.legacy_abstract_url && p.legacy_abstract_url.startsWith('http')) {
        jobs.push({ pIdx, field: 'legacy_abstract_url', category: 'Abstract', fileName: abstractFileName });
      }
    });

    if (jobs.length === 0) {
      alert('No legacy URLs found in posters.');
      return;
    }

    setPostersDownloadStatus({ total: jobs.length, done: 0, errors: 0, running: true });

    let done = 0;
    let errors = 0;

    for (const job of jobs) {
      const p = latestPosters.current[job.pIdx];
      const legacyUrl = job.field === 'legacy_url' ? p.legacy_url : p.legacy_abstract_url;
      const statusKey = `${job.pIdx}-${job.field}`;
      setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'downloading' }));

      try {
        const res = await fetch('/api/manager/download-legacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: legacyUrl,
            category: job.category,
            wsNum,
            fileName: job.fileName,
            session: 'Posters'
          })
        });
        const data = await res.json();
        if (data.success) {
          setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
          const fileField = job.field === 'legacy_url' ? 'poster_file' : 'abstract_file';
          updateItem(job.pIdx, fileField, job.fileName);
        } else {
          setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'error' }));
          errors++;
        }
      } catch (err: any) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'error' }));
        errors++;
      }
      done++;
      setPostersDownloadStatus({ total: jobs.length, done, errors, running: done < jobs.length });
    }

    setTimeout(() => {
      jobs.forEach(job => {
        const statusKey = `${job.pIdx}-${job.field}`;
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: '' }));
      });
      setPostersDownloadStatus(null);
    }, 5000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        
        <h3 className="text-xl font-bold text-sky-400">Poster Presentations</h3>
        <div className="flex items-center gap-2">
          {postersDownloadStatus?.running ? (
            <span className="text-[11px] text-yellow-400 font-bold font-mono animate-pulse">
              ⟳ {postersDownloadStatus.done}/{postersDownloadStatus.total}
              {postersDownloadStatus.errors > 0 && <span className="text-red-400 ml-1">({postersDownloadStatus.errors} err)</span>}
            </span>
          ) : postersDownloadStatus ? (
            <span className="text-[11px] text-green-400 font-bold font-mono">
              ✓ {postersDownloadStatus.done - postersDownloadStatus.errors} downloaded
              {postersDownloadStatus.errors > 0 && <span className="text-red-400 ml-1">({postersDownloadStatus.errors} failed)</span>}
            </span>
          ) : null}
          <button
            onClick={redownloadAllPosters}
            disabled={postersDownloadStatus?.running}
            className="bg-amber-700/60 hover:bg-amber-600/80 disabled:opacity-40 disabled:cursor-not-allowed text-amber-200 px-3 py-1.5 rounded text-[12px] font-bold transition-colors flex items-center gap-1"
            title="Re-download all posters and abstracts from legacy URLs"
          >
            ⟳ Re-download All
          </button>
        </div>

      </div>

      <div className="bg-slate-800 p-4 rounded border border-slate-700">
        <h4 className="text-sm font-bold text-slate-300 mb-3">Global Poster Session Settings</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Session Date (e.g. mm/dd/yyyy)</label>
            <input 
              type="date" 
              value={posters.length > 0 ? (posters[0].date || '') : ''} 
              onChange={e => {
                const updated = posters.map(p => ({ ...p, date: e.target.value }));
                onChange(updated);
              }} 
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Session Time (ISO 24h)</label>
            <input type="time" value={posters.length > 0 ? (posters[0].time || '') : ''} onChange={e => {
              const updated = posters.map(p => ({ ...p, time: e.target.value }));
              onChange(updated);
            }} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Session Name</label>
            <input type="text" value={posters.length > 0 ? (posters[0].session || '') : ''} onChange={e => {
              const updated = posters.map(p => ({ ...p, session: e.target.value }));
              onChange(updated);
            }} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Poster Session" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posters.map((p, i) => {
          const institutes: string[] = p.institutes || [];

          let presenterName = `Poster_${i}`;
          if (p.authors && p.authors.length > 0) {
            const presenter = p.authors.find(a => a.isPresenter) || p.authors[0];
            const namePart = presenter.name.split(',')[0].trim();
            const nameWords = namePart.split(' ');
            presenterName = nameWords[nameWords.length - 1].replace(/[^a-zA-Z0-9]/g, '');
          }

          let titleSnippet = `Topic_${i}`;
          if (p.title) {
            const words = p.title.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
            if (words.length > 0) titleSnippet = words.slice(0, 3).join('_');
          }

          const posterFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Poster.pdf`;
          const abstractFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Abstract.pdf`;

          return (
            <div key={i} className={`p-4 rounded border-l-4 border-yellow-500 relative ${i % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-800'}`}>
              <button 
                onClick={() => removeItem(i)} 
                className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold"
              >
                ✕
              </button>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                <input type="text" value={p.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
              </div>

              {/* ── Institute List ─────────────────────────────────────── */}
              <div className="mb-3 p-2 bg-slate-800/60 rounded border border-slate-700">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-amber-400">Institutes</label>
                  <button
                    onClick={() => {
                      updateItem(i, 'institutes', [...institutes, '']);
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
                          const updatedAuthors = p.authors.map(a =>
                            a.institute === oldName ? { ...a, institute: newName } : a
                          );
                          const updatedPoster = { ...latestPosters.current[i], institutes: updatedInstitutes, authors: updatedAuthors };
                          const updatedPosters = [...latestPosters.current];
                          updatedPosters[i] = updatedPoster;
                          onChange(updatedPosters);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded p-1 text-xs text-white"
                      />
                      <button
                        onClick={() => {
                          const removedInst = institutes[iIdx];
                          const updatedInstitutes = [...institutes];
                          updatedInstitutes.splice(iIdx, 1);
                          const updatedAuthors = p.authors.map(a =>
                            a.institute === removedInst ? { ...a, institute: null } : a
                          );
                          const updatedPoster = { ...latestPosters.current[i], institutes: updatedInstitutes, authors: updatedAuthors };
                          const updatedPosters = [...latestPosters.current];
                          updatedPosters[i] = updatedPoster;
                          onChange(updatedPosters);
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
                    updateItem(i, 'authors', updatedAuthors);
                  }} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded hover:bg-slate-600">+ Add Author</button>
                </label>
                <div className="space-y-2">
                  {(p.authors || []).map((author, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name={`post-presenter-${i}`} 
                        checked={author.isPresenter} 
                        onChange={() => {
                          const updatedAuthors = (p.authors || []).map((a, idx) => ({
                            ...a,
                            isPresenter: idx === aIdx
                          }));
                          updateItem(i, 'authors', updatedAuthors);
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
                          updateItem(i, 'authors', updatedAuthors);
                        }} 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" 
                      />
                      {/* Institute dropdown */}
                      <select
                        value={author.institute || ''}
                        onChange={e => {
                          const updatedAuthors = [...(p.authors || [])];
                          updatedAuthors[aIdx] = { ...updatedAuthors[aIdx], institute: e.target.value || null };
                          updateItem(i, 'authors', updatedAuthors);
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
                          updateItem(i, 'authors', updatedAuthors);
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
                  <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Poster URL</label>
                  <input 
                    type="url" 
                    value={p.legacy_url || ''} 
                    onChange={e => updateItem(i, 'legacy_url', e.target.value)} 
                    onPaste={e => handlePasteDownload(e, i, 'legacy_url', 'Poster', posterFileName)}
                    onBlur={e => handleUrlBlur(e.target.value, i, 'legacy_url', 'Poster', posterFileName)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-legacy_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-legacy_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-legacy_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                  />
                  {downloadingStatus[`${i}-legacy_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Abstract URL</label>
                  <input 
                    type="url" 
                    value={p.legacy_abstract_url || ''} 
                    onChange={e => updateItem(i, 'legacy_abstract_url', e.target.value)} 
                    onPaste={e => handlePasteDownload(e, i, 'legacy_abstract_url', 'Poster', abstractFileName)}
                    onBlur={e => handleUrlBlur(e.target.value, i, 'legacy_abstract_url', 'Poster', abstractFileName)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-legacy_abstract_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-legacy_abstract_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-legacy_abstract_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                  />
                  {downloadingStatus[`${i}-legacy_abstract_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DragDropZone 
                  label="Drop Poster PDF" 
                  category="Poster" 
                  wsNum={wsNum} 
                  fileName={posterFileName}
                  title={p.title}
                  onSuccess={() => updateItem(i, 'poster_file', posterFileName)}
                />
                <DragDropZone 
                  label="Drop Abstract PDF" 
                  category="Poster" 
                  wsNum={wsNum} 
                  fileName={abstractFileName}
                  title={p.title}
                  onSuccess={() => updateItem(i, 'abstract_file', abstractFileName)}
                />
              </div>
              {(p.poster_file || p.abstract_file) && (
                 <div className="mt-3 text-xs text-green-400 flex items-center gap-2 flex-wrap">
                   Attached: 
                   {p.poster_file && (
                     <div className="flex items-center gap-1 group">
                       <PreviewHover fileName={p.poster_file} wsNum={wsNum} session="Posters" title={p.title} />
                       <button onClick={() => handleDeleteFile(i, 'poster_file', 'Poster', 'Posters', p.poster_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                     </div>
                   )}
                   {p.poster_file && p.abstract_file && <span className="text-slate-500">|</span>}
                   {p.abstract_file && (
                     <div className="flex items-center gap-1 group">
                       <PreviewHover fileName={p.abstract_file} wsNum={wsNum} session="Posters" title={p.title + ' (Abstract)'} />
                       <button onClick={() => handleDeleteFile(i, 'abstract_file', 'Poster', 'Posters', p.abstract_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                     </div>
                   )}
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Poster — bottom of list */}
      <button
        onClick={addItem}
        className="w-full mt-2 py-3 rounded-lg border-2 border-dashed border-emerald-500/60 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-bold text-sm transition-all"
      >
        ＋ Add Poster
      </button>
    </div>
  );
}
