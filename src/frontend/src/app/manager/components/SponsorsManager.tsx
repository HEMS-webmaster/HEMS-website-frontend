"use client";

import React, { useEffect, useState } from 'react';
import DragDropZone from './DragDropZone';

interface RegistryEntry {
  company: string;
  url: string;
  logo_file: string;
}

interface Sponsor {
  company: string;
  year: string;
  link: string;
  logo_file?: string;
}

interface SponsorsManagerProps {
  sponsors: Sponsor[];
  wsNum: string;
  onChange: (sponsors: Sponsor[]) => void;
}

export default function SponsorsManager({ sponsors = [], wsNum, onChange }: SponsorsManagerProps) {
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

  // ── registry helpers ────────────────────────────────────────────────────────
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
    } else {
      setAddError(data.error || 'Failed to save.');
    }
  };

  // ── sponsor list helpers ────────────────────────────────────────────────────
  const addSponsor = () => {
    onChange([...sponsors, { company: '', year: '', link: '' }]);
  };

  const removeSponsor = (i: number) => {
    const updated = [...sponsors];
    updated.splice(i, 1);
    onChange(updated);
  };

  const selectFromRegistry = (i: number, companyName: string) => {
    const entry = registry.find((r) => r.company === companyName);
    if (!entry) return;
    const updated = [...sponsors];
    updated[i] = {
      ...updated[i],
      company: entry.company,
      link: entry.url,
      logo_file: entry.logo_file || updated[i].logo_file || '',
    };
    onChange(updated);
  };

  const updateField = (i: number, field: keyof Sponsor, value: string) => {
    const updated = [...sponsors];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  // Sponsors not yet in this list (for the dropdown)
  const availableCompanies = registry.filter(
    (r) => !sponsors.some((s) => s.company === r.company)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Corporate Sponsors</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewForm((p) => !p)}
            className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded text-sm"
          >
            {showNewForm ? '✕ Cancel' : '+ New to Registry'}
          </button>
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

      {/* Sponsor rows */}
      <div className="space-y-3">
        {sponsors.map((s, i) => {
          const logoFileName = s.logo_file || '';
          return (
            <div
              key={i}
              className={`p-4 rounded border-l-4 border-emerald-500 relative flex gap-4 items-start ${
                i % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-800'
              }`}
            >
              <button
                onClick={() => removeSponsor(i)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold"
              >
                ✕
              </button>
              <div className="flex-1 space-y-3">
                {/* Registry dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Company (Registry)</label>
                  <select
                    value={s.company || ''}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowNewForm(true);
                      } else {
                        selectFromRegistry(i, e.target.value);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                  >
                    <option value="">— Select from registry —</option>
                    {/* Keep current selection even if not in available list */}
                    {s.company && !availableCompanies.find(r => r.company === s.company) && (
                      <option value={s.company}>{s.company}</option>
                    )}
                    {availableCompanies.map((r) => (
                      <option key={r.company} value={r.company}>{r.company}</option>
                    ))}
                    <option value="__new__">＋ Add new company to registry…</option>
                  </select>
                </div>
                {/* Read-only resolved fields + editable year */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Name (editable)</label>
                    <input
                      type="text"
                      value={s.company || ''}
                      onChange={(e) => updateField(i, 'company', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Year Began</label>
                    <input
                      type="text"
                      value={s.year || ''}
                      onChange={(e) => updateField(i, 'year', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                      placeholder="e.g. 2019"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">External Link</label>
                    <input
                      type="url"
                      value={s.link || ''}
                      onChange={(e) => updateField(i, 'link', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
              {/* Logo drop zone */}
              <div className="w-40 flex-shrink-0">
                <DragDropZone
                  label="Drop Logo PNG"
                  category="Sponsor"
                  wsNum={wsNum}
                  fileName={logoFileName || `${(s.company || 'sponsor').replace(/[^a-zA-Z0-9]/g, '_')}_${s.year || 'logo'}.png`}
                  onSuccess={(filePath: string) => updateField(i, 'logo_file', filePath.split(/[\/]/).pop() || filePath)}
                />
                {s.logo_file && (
                  <div className="mt-1 text-xs text-green-400 truncate">{s.logo_file}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Sponsor — bottom of list */}
      <button
        onClick={addSponsor}
        className="w-full mt-2 py-3 rounded-lg border-2 border-dashed border-emerald-500/60 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-bold text-sm transition-all"
      >
        ＋ Add Sponsor
      </button>
    </div>
  );
}
