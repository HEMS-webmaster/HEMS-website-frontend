"use client";

import React, { useEffect, useState } from 'react';
import DragDropZone from './DragDropZone';

interface RegistryEntry {
  company: string;
  url: string;
  logo_file: string;
}

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
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ company: '', url: '', logo_file: '' });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetch('/api/manager/registry')
      .then((r) => r.json())
      .then(setRegistry)
      .catch(console.error);
  }, []);

  const saveToRegistry = async () => {
    setAddError('');
    if (!newEntry.company.trim()) { setAddError('Company name is required.'); return; }
    const res = await fetch('/api/manager/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });
    const data = await res.json();
    if (data.success) {
      setRegistry((prev) => [...prev, data.entry].sort((a, b) => a.company.localeCompare(b.company)));
      setNewEntry({ company: '', url: '', logo_file: '' });
      setShowNewForm(false);
      // Auto-select the newly added company as host
      onChange({ name: data.entry.company, url: data.entry.url, logo_file: data.entry.logo_file });
    } else {
      setAddError(data.error || 'Failed to save.');
    }
  };

  const selectFromRegistry = (companyName: string) => {
    if (!companyName) { onChange(null); return; }
    const entry = registry.find((r) => r.company === companyName);
    if (!entry) return;
    onChange({ name: entry.company, url: entry.url, logo_file: entry.logo_file || '' });
  };

  const updateField = (field: keyof HostCorporation, value: string) => {
    const updated = host ? { ...host, [field]: value } : { name: '', url: '', logo_file: '', [field]: value };
    onChange(updated);
  };

  const logoFileName = host?.logo_file
    || (host?.name ? `host_${host.name.replace(/[^a-zA-Z0-9]/g, '_')}.png` : 'host_logo.png');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Host Corporation</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewForm((p) => !p)}
            className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded text-sm"
          >
            {showNewForm ? '✕ Cancel' : '+ New to Registry'}
          </button>
          {host && (
            <button onClick={() => onChange(null)} className="text-red-400 hover:text-red-300 text-sm font-bold">
              ✕ Remove
            </button>
          )}
        </div>
      </div>

      {/* Add-to-registry form */}
      {showNewForm && (
        <div className="p-4 rounded border border-indigo-500/50 bg-indigo-900/20 space-y-3">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Add New Company to Registry</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company Name *</label>
              <input
                type="text"
                value={newEntry.company}
                onChange={(e) => setNewEntry((p) => ({ ...p, company: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Website URL</label>
              <input
                type="url"
                value={newEntry.url}
                onChange={(e) => setNewEntry((p) => ({ ...p, url: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Logo File</label>
              <input
                type="text"
                value={newEntry.logo_file}
                onChange={(e) => setNewEntry((p) => ({ ...p, logo_file: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                placeholder="Company_Logo.png"
              />
            </div>
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <button
            onClick={saveToRegistry}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded text-sm font-bold"
          >
            Save to Registry
          </button>
        </div>
      )}

      {/* Registry dropdown */}
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-1">Select Host Corporation</label>
        <select
          value={host?.name || ''}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setShowNewForm(true);
            } else {
              selectFromRegistry(e.target.value);
            }
          }}
          className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
        >
          <option value="">— None —</option>
          {registry.map((r) => (
            <option key={r.company} value={r.company}>{r.company}</option>
          ))}
          <option value="__new__">＋ Add new company to registry…</option>
        </select>
      </div>

      {/* Detail panel shown when a host is selected */}
      {host && (
        <div className="p-4 rounded border-l-4 border-indigo-500 bg-slate-800 flex gap-4 items-start">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Corporation Name</label>
              <input
                type="text"
                value={host.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">External Link</label>
              <input
                type="url"
                value={host.url || ''}
                onChange={(e) => updateField('url', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="w-48">
            <DragDropZone
              label="Drop Logo PNG"
              category="Sponsor"
              wsNum={wsNum}
              fileName={logoFileName}
              onSuccess={(filePath: string) => updateField('logo_file', filePath.split(/[\/]/).pop() || filePath)}
            />
            {host.logo_file && (
              <div className="mt-1 text-xs text-green-400 truncate">{host.logo_file}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
