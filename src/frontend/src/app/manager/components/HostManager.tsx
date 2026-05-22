"use client";

import React, { useEffect, useState } from 'react';

interface RegistryEntry {
  company: string;
  url: string;
  logo_file: string;
  year_began?: string;
}

export interface HostCorporation {
  name: string;
  url: string;
  logo_file?: string;
}

interface HostManagerProps {
  host: HostCorporation;
  onChange: (host: HostCorporation) => void;
}

export default function HostManager({ host, onChange }: HostManagerProps) {
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);

  useEffect(() => {
    fetch('/api/manager/registry')
      .then((r) => r.json())
      .then(setRegistry)
      .catch(console.error);
  }, []);

  const selectFromRegistry = (companyName: string) => {
    const entry = registry.find((r) => r.company === companyName);
    if (!entry) {
        // If they select empty, clear the host
        if (companyName === '') {
            onChange({ name: '', url: '', logo_file: '' });
        }
        return;
    }
    onChange({
      name: entry.company,
      url: entry.url,
      logo_file: entry.logo_file || '',
    });
  };

  const regEntry = registry.find((r) => r.company === host?.name);
  const resolvedLogo = regEntry?.logo_file || host?.logo_file || '';

  return (
    <div className="space-y-4 border-t border-slate-700 pt-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-amber-400">Workshop Host</h3>
      </div>

      <div className="p-4 rounded border-l-4 border-amber-400 bg-amber-900/20">
        <div className="space-y-3">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 mb-1">Host Organization (Registry)</label>
              <select
                value={host?.name || ''}
                onChange={(e) => selectFromRegistry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
              >
                <option value="">— Select from registry —</option>
                {host?.name && !registry.find(r => r.company === host.name) && (
                  <option value={host.name}>{host.name}</option>
                )}
                {registry.map((r) => (
                  <option key={r.company} value={r.company}>{r.company}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">If the organization is missing, add it using the Corporate Sponsors registry below.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">External Link</label>
              <div className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-sm text-slate-300 truncate">
                {host?.url || regEntry?.url || '—'}
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
    </div>
  );
}
