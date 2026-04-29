"use client";

import React, { useState, useRef, useEffect } from 'react';
import DragDropZone from './DragDropZone';
import PreviewHover from './PreviewHover';

import { Author } from './PresentationsManager';

interface Poster {
  title: string;
  authors: Author[];
  url: string;
  date?: string;
  time?: string;
  session?: string;
  abstract_url?: string;
  poster_file?: string;
  abstract_file?: string;
}

interface PostersManagerProps {
  posters: Poster[];
  wsNum: string;
  onChange: (posters: Poster[]) => void;
}

export default function PostersManager({ posters = [], wsNum, onChange }: PostersManagerProps) {
  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, string>>({});

  const handlePasteDownload = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
    field: 'url' | 'abstract_url',
    category: string,
    fileName: string
  ) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.startsWith('http')) return;

    e.preventDefault();

    // Update item immediately with the pasted URL
    updateItem(index, field, pastedText);

    const statusKey = `${index}-${field}`;
    setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'downloading' }));

    try {
      const res = await fetch('/api/manager/download-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pastedText,
          category,
          wsNum,
          fileName,
          session: 'Posters'
        })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        if (field === 'url') {
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
    onChange([...posters, { title: '', authors: [], url: '', date: '', time: '', session: '' }]);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Poster Presentations</h3>
        <button onClick={addItem} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm">+ Add Poster</button>
      </div>

      <div className="bg-slate-800 p-4 rounded border border-slate-700">
        <h4 className="text-sm font-bold text-slate-300 mb-3">Global Poster Session Settings</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Session Date (MM/DD/YYYY)</label>
            <input 
              type="text" 
              value={posters.length > 0 ? (posters[0].date || '') : ''} 
              placeholder="MM/DD/YYYY"
              onChange={e => {
                let val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
                const updated = posters.map(p => ({ ...p, date: val }));
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
            if (words.length > 0) {
              titleSnippet = words.slice(0, 3).join('_');
            }
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

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-1 flex justify-between items-end">
                  <span>Authors (Select Presenter)</span>
                  <button onClick={() => {
                    const updatedAuthors = [...(p.authors || [])];
                    updatedAuthors.push({ name: '', isPresenter: updatedAuthors.length === 0 });
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
                        className="cursor-pointer w-4 h-4 text-sky-500"
                        title="Mark as Presenting Author"
                      />
                      <input 
                        type="text" 
                        value={author.name || ''} 
                        placeholder="Author Name, Institution"
                        onChange={e => {
                          const updatedAuthors = [...(p.authors || [])];
                          updatedAuthors[aIdx] = { ...updatedAuthors[aIdx], name: e.target.value };
                          updateItem(i, 'authors', updatedAuthors);
                        }} 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" 
                      />
                      <button 
                        onClick={() => {
                          const updatedAuthors = [...(p.authors || [])];
                          updatedAuthors.splice(aIdx, 1);
                          if (author.isPresenter && updatedAuthors.length > 0) {
                            updatedAuthors[0].isPresenter = true;
                          }
                          updateItem(i, 'authors', updatedAuthors);
                        }}
                        className="text-red-400 hover:text-red-300 font-bold px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                <input type="text" value={p.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Poster URL</label>
                  <input 
                    type="url" 
                    value={p.url || ''} 
                    onChange={e => updateItem(i, 'url', e.target.value)} 
                    onPaste={e => handlePasteDownload(e, i, 'url', 'Poster', posterFileName)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                  />
                  {downloadingStatus[`${i}-url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Abstract URL</label>
                  <input 
                    type="url" 
                    value={p.abstract_url || ''} 
                    onChange={e => updateItem(i, 'abstract_url', e.target.value)} 
                    onPaste={e => handlePasteDownload(e, i, 'abstract_url', 'Poster', abstractFileName)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-abstract_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-abstract_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-abstract_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                  />
                  {downloadingStatus[`${i}-abstract_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
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
    </div>
  );
}
