"use client";

import React, { useState, useRef, useEffect } from 'react';
import DragDropZone from './DragDropZone';
import PreviewHover from './PreviewHover';

export interface Author {
  name: string;
  isPresenter: boolean;
}

interface Presentation {
  date: string;
  time: string;
  session: string;
  title: string;
  authors: Author[];
  url: string;
  abstract_url?: string;
  presentation_file?: string;
  abstract_file?: string;
}

interface PresentationsManagerProps {
  presentations: Presentation[];
  wsNum: string;
  onChange: (presentations: Presentation[]) => void;
}

export default function PresentationsManager({ presentations = [], wsNum, onChange }: PresentationsManagerProps) {
  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, string>>({});

  const handlePasteDownload = async (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
    field: 'url' | 'abstract_url',
    category: string,
    fileName: string,
    session: string
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
          session
        })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        if (field === 'url') {
          updateItem(index, 'presentation_file', fileName);
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
  
  const latestPresentations = useRef(presentations);
  useEffect(() => {
    latestPresentations.current = presentations;
  }, [presentations]);

  const updateItem = (index: number, field: keyof Presentation, value: any) => {
    const updated = [...latestPresentations.current];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addItem = () => {
    onChange([...presentations, {
      date: '', time: '', session: 'General', title: '', authors: [], url: ''
    }]);
  };

  const removeItem = (index: number) => {
    const updated = [...presentations];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Oral Presentations</h3>
        <button onClick={addItem} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm">+ Add Row</button>
      </div>

      {presentations.map((p, i) => {
        let presenterName = `Author_${i}`;
        if (p.authors && p.authors.length > 0) {
          const presenter = p.authors.find(a => a.isPresenter) || p.authors[0];
          const namePart = presenter.name.split(',')[0].trim();
          const nameWords = namePart.split(' ');
          presenterName = nameWords[nameWords.length - 1].replace(/[^a-zA-Z0-9]/g, '');
        }

        let titleSnippet = `Talk_${i}`;
        if (p.title) {
          const words = p.title.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
          if (words.length > 0) {
            titleSnippet = words.slice(0, 3).join('_');
          }
        }

        const presFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Presentation.pdf`;
        const absFileName = `${wsNum}th_${presenterName}_${titleSnippet}_Abstract.pdf`;

        return (
          <div key={i} className={`p-4 rounded border-l-4 border-sky-500 relative ${i % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-800'}`}>
            <button 
              onClick={() => removeItem(i)} 
              className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold"
            >
              ✕
            </button>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date (MM/DD/YYYY)</label>
                <input 
                  type="text" 
                  value={p.date || ''} 
                  placeholder="MM/DD/YYYY"
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                    if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5, 9);
                    updateItem(i, 'date', val);
                  }} 
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Time</label>
                <input type="text" value={p.time || ''} onChange={e => updateItem(i, 'time', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Session</label>
                <input type="text" value={p.session || ''} onChange={e => updateItem(i, 'session', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
              </div>
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
                      name={`pres-presenter-${i}`} 
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
                <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Presentation URL</label>
                <input 
                  type="url" 
                  value={p.url || ''} 
                  onChange={e => updateItem(i, 'url', e.target.value)} 
                  onPaste={e => handlePasteDownload(e, i, 'url', 'Presentation', presFileName, p.session)}
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
                  onPaste={e => handlePasteDownload(e, i, 'abstract_url', 'Abstract', absFileName, p.session)}
                  className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-abstract_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-abstract_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-abstract_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                />
                {downloadingStatus[`${i}-abstract_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DragDropZone 
                label={`Drop Presentation PDF`} 
                category="Presentation" 
                wsNum={wsNum} 
                fileName={presFileName}
                session={p.session}
                title={p.title}
                onSuccess={(path) => updateItem(i, 'presentation_file', presFileName)}
              />
              <DragDropZone 
                label={`Drop Abstract PDF`} 
                category="Abstract" 
                wsNum={wsNum} 
                fileName={absFileName}
                session={p.session}
                title={p.title}
                onSuccess={(path) => updateItem(i, 'abstract_file', absFileName)}
              />
            </div>
            {(p.presentation_file || p.abstract_file) && (
               <div className="mt-3 text-xs text-green-400 flex items-center gap-2 flex-wrap">
                 Attached: 
                 {p.presentation_file && <PreviewHover fileName={p.presentation_file} wsNum={wsNum} session={p.session} title={p.title} />}
                 {p.presentation_file && p.abstract_file && <span className="text-slate-500">|</span>}
                 {p.abstract_file && <PreviewHover fileName={p.abstract_file} wsNum={wsNum} session={p.session} title={p.title} />}
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
