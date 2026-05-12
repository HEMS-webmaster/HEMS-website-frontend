"use client";

import React, { useState, useRef, useEffect } from 'react';
import DragDropZone from './DragDropZone';
import PreviewHover from './PreviewHover';

interface Student {
  title?: string;
  name: string;
  institute: string;
  legacy_url?: string;
  legacy_abstract_url?: string;
  presentation_file?: string;
  abstract_file?: string;
}

interface StudentsManagerProps {
  students: Student[];
  wsNum: string;
  onChange: (students: Student[]) => void;
}

export default function StudentsManager({ students = [], wsNum, onChange }: StudentsManagerProps) {

  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, string>>({});

  const latestStudents = useRef(students);
  useEffect(() => {
    latestStudents.current = students;
  }, [students]);

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
          fileName
        })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadingStatus(prev => ({ ...prev, [statusKey]: 'success' }));
        const targetFileField = field === 'legacy_url' ? 'presentation_file' : 'abstract_file';
        updateItem(index, targetFileField, fileName);
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

  const updateItem = (index: number, field: keyof Student, value: string) => {
    const updated = [...latestStudents.current];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addItem = () => {
    onChange([...students, { title: '', name: '', institute: '', legacy_url: '', legacy_abstract_url: '' }]);
  };

  const removeItem = (index: number) => {
    const updated = [...students];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleDeleteFile = async (index: number, field: keyof Student, category: string, session: string, fileName: string) => {
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
        <h3 className="text-xl font-bold text-sky-400">Student Award Presenters</h3>
      </div>

      <div className="space-y-4">
        {students.map((s, i) => {
          const cleanName = s.name ? s.name.replace(/[^a-zA-Z0-9]/g, '_') : `Student_${i}`;
          const presFileName = `${wsNum}th_${cleanName}_Student_Award.pdf`;
          const absFileName = `${wsNum}th_${cleanName}_Student_Abstract.pdf`;

          return (
            <div key={i} className={`p-4 rounded border-l-4 border-purple-500 relative flex gap-4 items-start ${i % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-800'}`}>
              <button 
                onClick={() => removeItem(i)} 
                className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold"
              >
                ✕
              </button>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Presentation Title</label>
                  <input type="text" value={s.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Student Name</label>
                  <input type="text" value={s.name || ''} onChange={e => updateItem(i, 'name', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Affiliate Institute</label>
                  <input type="text" value={s.institute || ''} onChange={e => updateItem(i, 'institute', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Legacy URL</label>
                  <input 
                    type="url" 
                    value={s.legacy_url || ''} 
                    onChange={e => updateItem(i, 'legacy_url', e.target.value)} 
                    onPaste={e => handlePasteDownload(e, i, 'legacy_url', 'Student_Award', presFileName)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-legacy_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-legacy_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-legacy_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                  />
                  {downloadingStatus[`${i}-legacy_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Legacy Abstract URL</label>
                  <input 
                    type="url" 
                    value={s.legacy_abstract_url || ''} 
                    onChange={e => updateItem(i, 'legacy_abstract_url', e.target.value)} 
                    onPaste={e => handlePasteDownload(e, i, 'legacy_abstract_url', 'Student_Award', absFileName)}
                    className={`w-full bg-slate-900 border ${downloadingStatus[`${i}-legacy_abstract_url`] === 'downloading' ? 'border-yellow-500' : downloadingStatus[`${i}-legacy_abstract_url`] === 'success' ? 'border-green-500' : downloadingStatus[`${i}-legacy_abstract_url`] === 'error' ? 'border-red-500' : 'border-slate-600'} rounded p-2 text-sm text-white transition-colors`} 
                  />
                  {downloadingStatus[`${i}-legacy_abstract_url`] === 'downloading' && <span className="absolute top-1 right-2 text-[10px] text-yellow-500 font-bold">Downloading...</span>}
                </div>
              </div>
              <div className="w-48 flex flex-col gap-2">
                <div>
                  <DragDropZone 
                    label="Drop Pres. PDF" 
                    category="Student_Award" 
                    wsNum={wsNum} 
                    fileName={presFileName}
                    onSuccess={() => updateItem(i, 'presentation_file', presFileName)}
                  />
                  {s.presentation_file && (
                    <div className="mt-1 text-xs text-green-400 flex items-center gap-1 group">
                      <PreviewHover fileName={s.presentation_file} wsNum={wsNum} session="Student_Award" title={s.title || 'Student Award'} />
                      <button onClick={() => handleDeleteFile(i, 'presentation_file', 'Student_Award', 'Student_Award', s.presentation_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                    </div>
                  )}
                </div>
                <div>
                  <DragDropZone 
                    label="Drop Abstract PDF" 
                    category="Student_Award" 
                    wsNum={wsNum} 
                    fileName={absFileName}
                    onSuccess={() => updateItem(i, 'abstract_file', absFileName)}
                  />
                  {s.abstract_file && (
                    <div className="mt-1 text-xs text-green-400 flex items-center gap-1 group">
                      <PreviewHover fileName={s.abstract_file} wsNum={wsNum} session="Student_Award" title={(s.title || 'Student Award') + ' (Abstract)'} />
                      <button onClick={() => handleDeleteFile(i, 'abstract_file', 'Student_Award', 'Student_Award', s.abstract_file!)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="Delete File">✕</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Student — bottom of list */}
      <button
        onClick={addItem}
        className="w-full mt-2 py-3 rounded-lg border-2 border-dashed border-purple-500/60 text-purple-400 hover:border-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-bold text-sm transition-all"
      >
        ＋ Add Student
      </button>
    </div>
  );
}
