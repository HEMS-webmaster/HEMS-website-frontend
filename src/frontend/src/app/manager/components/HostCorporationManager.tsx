"use client";

import React from 'react';
import DragDropZone from './DragDropZone';

export interface HostCorporation {
  name: string;
  url: string;
  logo_file?: string;
}

interface HostCorporationManagerProps {
  host: HostCorporation | null | undefined;
  wsNum: string;
  onChange: (host: HostCorporation | null) => void;
}

export default function HostCorporationManager({ host, wsNum, onChange }: HostCorporationManagerProps) {

  const updateField = (field: keyof HostCorporation, value: string) => {
    const updated = host ? { ...host, [field]: value } : { name: '', url: '', logo_file: '', [field]: value };
    onChange(updated);
  };

  const removeHost = () => {
    onChange(null);
  };

  const addHost = () => {
    onChange({ name: '', url: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Host Corporation</h3>
        {!host ? (
          <button onClick={addHost} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm">+ Add Host</button>
        ) : (
          <button onClick={removeHost} className="text-red-400 hover:text-red-300 font-bold text-sm">✕ Remove</button>
        )}
      </div>

      {host && (
        <div className="p-4 rounded border-l-4 border-indigo-500 bg-slate-800 flex gap-4 items-start">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Corporation Name</label>
              <input type="text" value={host.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">External Link</label>
              <input type="url" value={host.url} onChange={e => updateField('url', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="https://..." />
            </div>
          </div>
          <div className="w-48">
            <DragDropZone 
              label="Drop Logo PNG" 
              category="Sponsor" // We reuse Sponsor category so it uploads into the sponsors bucket
              wsNum={wsNum} 
              fileName={host.name ? `host_${host.name.replace(/[^a-zA-Z0-9]/g, '_')}.png` : 'host_logo.png'}
              onSuccess={() => updateField('logo_file', host.name ? `host_${host.name.replace(/[^a-zA-Z0-9]/g, '_')}.png` : 'host_logo.png')}
            />
            {host.logo_file && <div className="mt-1 text-xs text-green-400 truncate">{host.logo_file}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
