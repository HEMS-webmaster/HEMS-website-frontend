"use client";

import React from 'react';

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
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
      }
    });

    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-sky-400">Itinerary Events</h3>
        <div className="flex gap-2">
          <button onClick={sortChronologically} className="bg-sky-700 hover:bg-sky-600 px-3 py-1 rounded text-sm text-white font-bold">Sort Chronologically</button>
          <button onClick={addDateGroup} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm">+ Add Date Group</button>
        </div>
      </div>

      <div className="space-y-6">
        {events.map((group, gIdx) => (
          <div key={gIdx} className="p-5 rounded border-l-4 border-indigo-500 relative bg-slate-800 shadow-md">
            <button 
              onClick={() => removeDateGroup(gIdx)} 
              className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold px-2"
              title="Remove Date Group"
            >
              ✕
            </button>
            
            <div className="grid grid-cols-2 gap-4 mb-6 border-b border-slate-700 pb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date</label>
                <input type="date" value={group.date} onChange={e => updateDateGroup(gIdx, 'date', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date Title (e.g. Travel Day)</label>
                <input type="text" value={group.title} onChange={e => updateDateGroup(gIdx, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
              </div>
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-slate-700">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-300">Events on {group.date || 'Unspecified Date'}</h4>
                <button onClick={() => addEvent(gIdx)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-xs">+ Add Event</button>
              </div>

              {(group.events || []).map((ev, eIdx) => (
                <div key={eIdx} className="p-4 rounded border border-slate-600 relative bg-slate-900/50">
                  <button 
                    onClick={() => removeEvent(gIdx, eIdx)} 
                    className="absolute top-2 right-2 text-red-400 hover:text-red-300 font-bold px-2"
                    title="Remove Event"
                  >
                    ✕
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Start Time</label>
                      <input type="time" value={ev.time} onChange={e => updateEvent(gIdx, eIdx, 'time', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">End Time (Optional)</label>
                      <input type="time" value={ev.end_time || ''} onChange={e => updateEvent(gIdx, eIdx, 'end_time', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                      <input type="text" value={ev.title} onChange={e => updateEvent(gIdx, eIdx, 'title', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Breakfast" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Subtitle / Details</label>
                      <input type="text" value={ev.subtitle} onChange={e => updateEvent(gIdx, eIdx, 'subtitle', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Dinner on your own" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Subtitle URL (Hyperlink)</label>
                      <input type="url" value={ev.subtitle_url || ''} onChange={e => updateEvent(gIdx, eIdx, 'subtitle_url', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Location</label>
                      <input type="text" value={ev.location} onChange={e => updateEvent(gIdx, eIdx, 'location', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. Room 402" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Location URL (Hyperlink)</label>
                      <input type="url" value={ev.location_url} onChange={e => updateEvent(gIdx, eIdx, 'location_url', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" placeholder="https://maps..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
