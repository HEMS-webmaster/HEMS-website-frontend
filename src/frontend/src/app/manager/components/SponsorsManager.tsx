"use client";

import React, { useEffect, useState } from 'react';
import DragDropZone from './DragDropZone';

interface RegistryEntry {
  company: string;
  url: string;
  logo_file: string;
  year_began?: string;
}

export interface Sponsor {
  company: string;
  year: string;
  link: string;
  logo_file?: string;
  isHost?: boolean;
}

interface SponsorsManagerProps {
  sponsors: Sponsor[];
  wsNum: string;
  onChange: (sponsors: Sponsor[]) => void;
}

export default function SponsorsManager({ sponsors = [], wsNum, onChange }: SponsorsManagerProps) {
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showManageRegistry, setShowManageRegistry] = useState(false);
  const [newEntry, setNewEntry] = useState({ company: '', url: '', logo_file: '', year_began: '' });
  const [addError, setAddError] = useState('');
  const [deleteError, setDeleteError] = useState('');

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
      setNewEntry({ company: '', url: '', logo_file: '', year_began: '' });
      setShowNewForm(false);
      // Auto-open Manage Registry so the user can immediately drop a logo
      setShowManageRegistry(true);
    } else {
      setAddError(data.error || 'Failed to save.');
    }
  };

  const deleteFromRegistry = async (company: string) => {
    setDeleteError('');
    if (!confirm(`Remove "${company}" from the registry? This won't affect workshops already saved.`)) return;
    const res = await fetch(`/api/manager/registry?company=${encodeURIComponent(company)}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setRegistry((prev) => prev.filter((r) => r.company !== company));
    } else {
      setDeleteError(data.error || 'Failed to delete.');
    }
  };

  // Produce a stable, filesystem-safe logo filename from the company name
  const standardLogoName = (company: string) =>
    company.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') + '.png';

  const patchRegistryField = async (company: string, field: string, value: string) => {
    const res = await fetch('/api/manager/registry', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, [field]: value }),
    });
    const data = await res.json();
    if (data.success) {
      setRegistry((prev) =>
        prev.map((r) => r.company === company ? { ...r, [field]: value } : r)
      );
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
      logo_file: entry.logo_file || '',
      year: entry.year_began || '',
    };
    onChange(updated);
  };

  const updateField = (i: number, field: keyof Sponsor, value: string | boolean) => {
    const updated = [...sponsors];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const toggleHost = (i: number) => {
    const updated = sponsors.map((s, idx) => ({
      ...s,
      isHost: idx === i ? !s.isHost : false,
    }));
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
            onClick={() => { setShowManageRegistry((p) => !p); setShowNewForm(false); }}
            className="bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded text-sm text-slate-200"
          >
            {showManageRegistry ? '✕ Close Registry' : '⋮ Manage Registry'}
          </button>
          <button
            onClick={() => { setShowNewForm((p) => !p); setShowManageRegistry(false); }}
            className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded text-sm"
          >
            {showNewForm ? '✕ Cancel' : '+ New to Registry'}
          </button>
        </div>
      </div>

      {/* Manage Registry panel */}
      {showManageRegistry && (
        <div className="p-4 rounded border border-slate-600 bg-slate-800/60 space-y-3">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Corporate Registry ({registry.length} entries)
          </p>
          {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}

          <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1">
            {registry.map((r) => {
              const logoFileName = r.logo_file || standardLogoName(r.company);
              return (
                <div key={r.company} className="rounded border border-slate-700 bg-slate-900/60 p-3 group">
                  {/* Row header: name + delete */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white block truncate">{r.company}</span>
                      {r.url && <span className="text-xs text-slate-500 block truncate">{r.url}</span>}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-600 font-mono">
                          Logo: <span className={r.logo_file ? 'text-emerald-400' : 'text-slate-500'}>
                            {logoFileName}
                          </span>
                        </span>
                        <span className="text-xs text-slate-600 font-mono">
                          Since: <span className={r.year_began ? 'text-amber-400' : 'text-slate-500'}>
                            {r.year_began || '—'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFromRegistry(r.company)}
                      className="text-red-500 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm flex-shrink-0 mt-0.5"
                      title={`Remove ${r.company} from registry`}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Year began editor */}
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs text-slate-400 whitespace-nowrap">Year Began:</label>
                    <input
                      type="text"
                      value={r.year_began || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRegistry((prev) =>
                          prev.map((reg) => reg.company === r.company ? { ...reg, year_began: val } : reg)
                        );
                      }}
                      onBlur={(e) => patchRegistryField(r.company, 'year_began', e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      placeholder="e.g. 2019"
                    />
                  </div>

                  {/* Drag-and-drop logo zone */}
                  <DragDropZone
                    label="Drop logo PNG"
                    category="Sponsor"
                    wsNum="0"
                    fileName={logoFileName}
                    title={r.company}
                    onSuccess={(filePath: string) => {
                      const basename = filePath.split(/[/\\]/).pop() || logoFileName;
                      patchRegistryField(r.company, 'logo_file', basename);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {registry.length === 0 && (
            <p className="text-slate-500 text-xs text-center py-2">Registry is empty.</p>
          )}
        </div>
      )}

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
              <label className="block text-xs text-slate-400 mb-1">Year Began</label>
              <input
                type="text"
                value={newEntry.year_began}
                onChange={(e) => setNewEntry((p) => ({ ...p, year_began: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
                placeholder="e.g. 2019"
              />
            </div>
          </div>
          
          <div className="mt-4">
            {newEntry.company.trim() ? (
              <div className="space-y-2">
                <DragDropZone
                  label="Drop logo PNG"
                  category="Sponsor"
                  wsNum="0"
                  fileName={newEntry.logo_file || standardLogoName(newEntry.company)}
                  title={newEntry.company}
                  onSuccess={(filePath: string) => {
                    const basename = filePath.split(/[/\\]/).pop() || standardLogoName(newEntry.company);
                    setNewEntry(prev => ({ ...prev, logo_file: basename }));
                  }}
                />
                {newEntry.logo_file && (
                  <p className="text-xs text-emerald-400 font-mono">✓ Logo staged: {newEntry.logo_file}</p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-indigo-500/30 rounded p-4 text-center text-indigo-300/50 text-xs">
                Type a company name above to enable logo upload.
              </div>
            )}
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
          const regEntry = registry.find((r) => r.company === s.company);
          const resolvedLogo = regEntry?.logo_file || s.logo_file || '';
          const resolvedYear = regEntry?.year_began || s.year || '';
          return (
            <div
              key={i}
              className={`p-4 rounded relative flex gap-4 items-start border-l-4 ${
                s.isHost
                  ? 'border-amber-400 bg-amber-900/20'
                  : 'border-emerald-500 ' + (i % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-800')
              }`}
            >
              <button
                onClick={() => removeSponsor(i)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold"
              >
                ✕
              </button>
              <div className="flex-1 space-y-3">
                {/* Top row: registry dropdown + host toggle */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-1">Company (Registry)</label>
                    <select
                      value={s.company || ''}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setShowNewForm(true);
                          setShowManageRegistry(false);
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
                  {/* Host checkbox */}
                  <div className="flex-shrink-0 pb-1">
                    <label className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all ${
                      s.isHost
                        ? 'border-amber-400 bg-amber-900/30 text-amber-300'
                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-amber-500/50 hover:text-amber-400/70'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!s.isHost}
                        onChange={() => toggleHost(i)}
                        className="accent-amber-400"
                      />
                      <span className="text-xs font-bold whitespace-nowrap">
                        {s.isHost ? '★ Workshop Host' : '☆ Host'}
                      </span>
                    </label>
                  </div>
                </div>
                {/* Read-only resolved fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Sponsor Since</label>
                    <div className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-sm text-amber-400 font-mono">
                      {resolvedYear || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">External Link</label>
                    <div className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-sm text-slate-300 truncate">
                      {s.link || regEntry?.url || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Logo File</label>
                    <div className={`w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-sm font-mono truncate ${resolvedLogo ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {resolvedLogo || '—'}
                    </div>
                  </div>
                </div>
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
