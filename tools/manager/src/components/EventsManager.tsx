"use client";

import React from 'react';

/** Normalize a free-text time string to "H:MM a.m." / "H:MM p.m." format. */
function normalizeTime(raw: string): string {
  if (!raw) return '';
  const t = raw.trim();

  // Match "H:MM am/pm" or "H:MM a.m./p.m." (any dot/spacing variant)
  const ampmMatch = t.match(/^(\d{1,2}):(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?|am|pm)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]);
    const m = ampmMatch[2];
    const isPm = /p/i.test(ampmMatch[3]);
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${isPm ? 'p.m.' : 'a.m.'}`;
  }

  // Match bare 24h "HH:MM"
  const h24Match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    let h = parseInt(h24Match[1]);
    const m = h24Match[2];
    if (h >= 13) return `${h - 12}:${m} p.m.`;
    if (h === 12) return `12:${m} p.m.`;
    if (h === 0) return `12:${m} a.m.`;
    return `${h}:${m} a.m.`;
  }

  return t; // return unchanged if unparseable
}

/** Parse a time string ("H:MM a.m." or 24h "HH:MM") into total minutes for sorting. */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return Infinity;
  const t = timeStr.trim().toLowerCase().replace(/\./g, '');

  // "H:MM am/pm"
  const match = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (match) {
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const isPm = match[3] === 'pm';
    if (isPm && h !== 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return h * 60 + m;
  }

  // bare "HH:MM" (24h)
  const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1]) * 60 + parseInt(h24[2]);

  return Infinity;
}

export interface ItineraryEvent {
  time: string;
  end_time?: string;
  title: string;
  subtitle: string;
  subtitle_url?: string;
  location: string;
  location_url: string;
}

export interface DateGroup {
  date: string;
  title: string;
  events: ItineraryEvent[];
}

interface EventsManagerProps {
  events: DateGroup[];
  onChange: (events: DateGroup[]) => void;
}

export default function EventsManager({ events = [], onChange }: EventsManagerProps) {
  const [openGroups, setOpenGroups] = React.useState<Record<number, boolean>>({});

  const toggleGroup = (gIdx: number) => {
    setOpenGroups(prev => ({ ...prev, [gIdx]: !prev[gIdx] }));
  };

  const isGroupOpen = (gIdx: number) => {
    return openGroups[gIdx] !== false; // Default to open (true)
  };

  // Group functions
  const addDateGroup = () => {
    onChange([...events, { date: '', title: '', events: [] }]);
  };

  const removeDateGroup = (gIdx: number) => {
    const updated = [...events];
    updated.splice(gIdx, 1);
    onChange(updated);
  };

  const updateDateGroup = (gIdx: number, field: keyof DateGroup, value: string) => {
    const updated = [...events];
    updated[gIdx] = { ...updated[gIdx], [field]: value };
    onChange(updated);
  };

  // Event functions
  const addEvent = (gIdx: number) => {
    const updated = [...events];
    if (!updated[gIdx].events) {
      updated[gIdx].events = [];
    }
    updated[gIdx].events.push({ time: '', end_time: '', title: '', subtitle: '', subtitle_url: '', location: '', location_url: '' });
    onChange(updated);
  };

  const removeEvent = (gIdx: number, eIdx: number) => {
    const updated = [...events];
    if (updated[gIdx].events) {
      updated[gIdx].events.splice(eIdx, 1);
    }
    onChange(updated);
  };

  const updateEvent = (gIdx: number, eIdx: number, field: keyof ItineraryEvent, value: string) => {
    const updated = [...events];
    if (updated[gIdx].events && updated[gIdx].events[eIdx]) {
      updated[gIdx].events[eIdx] = { ...updated[gIdx].events[eIdx], [field]: value };
    }
    onChange(updated);
  };

  const moveEvent = (fromGIdx: number, eIdx: number, toGIdx: number) => {
    if (fromGIdx === toGIdx) return;
    const updated = [...events];
    
    // Deep copy the event so we don't hold references across arrays
    const eventToMove = { ...updated[fromGIdx].events[eIdx] };
    
    // Remove from old
    updated[fromGIdx].events.splice(eIdx, 1);
    
    // Push to new
    if (!updated[toGIdx].events) {
      updated[toGIdx].events = [];
    }
    updated[toGIdx].events.push(eventToMove);
    
    // Re-sort the target group by time
    updated[toGIdx].events.sort((a, b) => {
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });

    onChange(updated);
  };

  const sortChronologically = () => {
    const updated = [...events];
    
    // Sort groups by date
    updated.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

    // Sort events within each group by time
    updated.forEach(group => {
      if (group.events && Array.isArray(group.events)) {
        group.events.sort((a, b) => {
          return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
        });
      }
    });

    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Itinerary Events</h3>
        <button onClick={sortChronologically} className="bg-sky-700 hover:bg-sky-600 px-3 py-1 rounded text-sm text-white font-bold">↕ Sort Chronologically</button>
      </div>

      <div className="space-y-6">
        {events.map((group, gIdx) => {
          const isOpen = isGroupOpen(gIdx);
          return (
            <div key={gIdx} className="p-0 rounded-lg overflow-hidden border border-indigo-500/30 bg-slate-800 shadow-md">
              {/* Collapsible Header */}
              <div className="flex justify-between items-center bg-slate-700/30 px-5 py-3 select-none">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleGroup(gIdx)}>
                  <span className="text-slate-400 text-sm transition-transform duration-200">
                    {isOpen ? '▼' : '▶'}
                  </span>
                  <span className="font-bold text-indigo-400">
                    {group.date ? `${group.date}` : 'Unspecified Date'} {group.title ? `— ${group.title}` : ''}
                  </span>
                </div>
                <button 
                  onClick={() => removeDateGroup(gIdx)} 
                  className="text-red-400 hover:text-red-300 font-bold px-2 text-sm"
                  title="Remove Date Group"
                >
                  ✕ Remove Date Group
                </button>
              </div>

              {isOpen && (
                <div className="p-5 border-t border-slate-700/50 bg-slate-800/20">
                  <div className="grid grid-cols-2 gap-4 mb-6 border-b border-slate-700 pb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Date (e.g. mm/dd/yyyy)</label>
                      <input type="date" value={group.date || ''} onChange={e => updateDateGroup(gIdx, 'date', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Date Title (e.g. Travel Day)</label>
                      <input type="text" value={group.title || ''} onChange={e => updateDateGroup(gIdx, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                    </div>
                  </div>

                  <div className="space-y-4 pl-4 border-l-2 border-slate-700">
                    <h4 className="text-sm font-bold text-slate-300 mb-3">Events on {group.date || 'Unspecified Date'}</h4>

                    {(group.events || []).map((ev, eIdx) => (
                      <div key={eIdx} className="p-4 rounded border border-slate-600 relative bg-slate-900/50 mt-4">
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          {events.length > 1 && (
                            <select 
                              className="bg-slate-800 text-xs text-slate-300 border border-slate-600 rounded px-1 py-0.5 outline-none focus:border-sky-500"
                              value=""
                              onChange={(e) => moveEvent(gIdx, eIdx, parseInt(e.target.value))}
                            >
                              <option value="" disabled>Move to date...</option>
                              {events.map((targetGroup, tIdx) => (
                                tIdx !== gIdx && <option key={tIdx} value={tIdx}>{targetGroup.date || `Group ${tIdx + 1}`}</option>
                              ))}
                            </select>
                          )}
                          <button 
                            onClick={() => removeEvent(gIdx, eIdx)} 
                            className="text-red-400 hover:text-red-300 font-bold px-2"
                            title="Remove Event"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 mt-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Start Time</label>
                            <input type="text" value={ev.time || ''} placeholder="e.g. 9:00 a.m." onChange={e => updateEvent(gIdx, eIdx, 'time', e.target.value)} onBlur={e => { const n = normalizeTime(e.target.value); if (n !== e.target.value) updateEvent(gIdx, eIdx, 'time', n); }} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">End Time (Optional)</label>
                            <input type="text" value={ev.end_time || ''} placeholder="e.g. 10:00 a.m." onChange={e => updateEvent(gIdx, eIdx, 'end_time', e.target.value)} onBlur={e => { const n = normalizeTime(e.target.value); if (n !== e.target.value) updateEvent(gIdx, eIdx, 'end_time', n); }} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                            <input type="text" value={ev.title || ''} onChange={e => updateEvent(gIdx, eIdx, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Breakfast" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Subtitle / Details</label>
                            <input type="text" value={ev.subtitle || ''} onChange={e => updateEvent(gIdx, eIdx, 'subtitle', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Dinner on your own" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Subtitle URL (Hyperlink)</label>
                            <input type="url" value={ev.subtitle_url || ''} onChange={e => updateEvent(gIdx, eIdx, 'subtitle_url', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="https://..." />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Location</label>
                            <input type="text" value={ev.location || ''} onChange={e => updateEvent(gIdx, eIdx, 'location', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Room 402" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Location URL (Hyperlink)</label>
                            <input type="url" value={ev.location_url || ''} onChange={e => updateEvent(gIdx, eIdx, 'location_url', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="https://maps..." />
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Add Event — bottom of date group */}
                    <button
                      onClick={() => addEvent(gIdx)}
                      className="w-full mt-3 py-2 rounded-lg border-2 border-dashed border-sky-600/50 text-sky-400 hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-300 font-bold text-xs transition-all"
                    >
                      ＋ Add Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Date Group — bottom, full-width */}
      <button
        onClick={addDateGroup}
        className="w-full mt-2 py-3 rounded-lg border-2 border-dashed border-indigo-500/60 text-indigo-400 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 font-bold text-sm transition-all"
      >
        ＋ Add Date Group
      </button>
    </div>
  );
}
