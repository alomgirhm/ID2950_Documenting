'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, Edit2, Check, ArrowRight, Sunset } from 'lucide-react';
import { DayLog, TimeEntry } from '@/types';

const STORAGE_KEY = 'id2950_minimal_days_v1';

const DEFAULT_DAYS: DayLog[] = [
  {
    id: 'day-1',
    name: '2 October 2026',
    month: 'October 2026',
    entries: [
      {
        id: 'entry-1',
        startTime: '9:00',
        endTime: '10:00',
        work: 'Book reading',
      },
      {
        id: 'entry-2',
        startTime: '10:00',
        endTime: '12:30',
        work: 'Self development project',
      },
      {
        id: 'entry-3',
        startTime: '13:30',
        endTime: '15:00',
        work: 'Deep focus & learning',
      },
    ],
  },
];

export default function ID2950Page() {
  const [days, setDays] = useState<DayLog[]>([]);
  const [activeMonth, setActiveMonth] = useState<string>('October 2026');
  const [newDayName, setNewDayName] = useState<string>('');
  const [newMonthInput, setNewMonthInput] = useState<string>('');
  const [isAddingMonth, setIsAddingMonth] = useState<boolean>(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: DayLog[] = JSON.parse(stored);
        setDays(parsed);
        if (parsed.length > 0 && parsed[0].month) {
          setActiveMonth(parsed[0].month);
        }
      } else {
        setDays(DEFAULT_DAYS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DAYS));
      }
    } catch {
      setDays(DEFAULT_DAYS);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever days state changes
  const saveDays = (updatedDays: DayLog[]) => {
    setDays(updatedDays);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDays));
    }
  };

  // Distinct months list
  const months = Array.from(new Set(days.map((d) => d.month).filter(Boolean)));
  if (!months.includes(activeMonth) && activeMonth) {
    months.push(activeMonth);
  }

  // Filter days for active month
  const filteredDays = days.filter((d) => d.month === activeMonth);

  // Add a new Day with user-assigned name
  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDayName.trim();
    if (!trimmed) return;

    const newDay: DayLog = {
      id: `day-${Date.now()}`,
      name: trimmed,
      month: activeMonth,
      entries: [
        {
          id: `entry-${Date.now()}-1`,
          startTime: '9:00',
          endTime: '10:00',
          work: 'Book reading',
        },
      ],
    };

    const updated = [...days, newDay];
    saveDays(updated);
    setNewDayName('');
  };

  // Delete a Day
  const handleDeleteDay = (dayId: string) => {
    if (confirm('Delete this day and all its logged time entries?')) {
      const updated = days.filter((d) => d.id !== dayId);
      saveDays(updated);
    }
  };

  // Rename a Day
  const handleStartRename = (day: DayLog) => {
    setEditingDayId(day.id);
    setEditingDayName(day.name);
  };

  const handleSaveRename = (dayId: string) => {
    if (!editingDayName.trim()) {
      setEditingDayId(null);
      return;
    }
    const updated = days.map((d) =>
      d.id === dayId ? { ...d, name: editingDayName.trim() } : d
    );
    saveDays(updated);
    setEditingDayId(null);
  };

  // Add Time Entry under a Day
  const handleAddTimeEntry = (dayId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const lastEntry = d.entries[d.entries.length - 1];
      const newEntry: TimeEntry = {
        id: `entry-${Date.now()}`,
        startTime: lastEntry ? lastEntry.endTime : '9:00',
        endTime: '',
        work: '',
      };
      return {
        ...d,
        entries: [...d.entries, newEntry],
      };
    });
    saveDays(updated);
  };

  // Update a specific Time Entry
  const handleUpdateEntry = (
    dayId: string,
    entryId: string,
    field: 'startTime' | 'endTime' | 'work',
    value: string
  ) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        entries: d.entries.map((entry) =>
          entry.id === entryId ? { ...entry, [field]: value } : entry
        ),
      };
    });
    saveDays(updated);
  };

  // Delete a Time Entry
  const handleDeleteEntry = (dayId: string, entryId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        entries: d.entries.filter((entry) => entry.id !== entryId),
      };
    });
    saveDays(updated);
  };

  // Add a new Month
  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMonthInput.trim();
    if (!trimmed) return;
    setActiveMonth(trimmed);
    setNewMonthInput('');
    setIsAddingMonth(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center font-mono text-xs">
        Loading ID2950...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-neutral-800">
      
      {/* Top Minimalist Header */}
      <header className="border-b border-neutral-900 px-4 sm:px-8 py-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                ID2950
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                minimal
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
              <Sunset className="w-3.5 h-3.5 text-amber-500/80" />
              Self-defined days & custom time tracking (Starts at sunset or whenever you define)
            </p>
          </div>

          {/* Simple Month Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 ml-1.5" />
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 font-medium px-2 py-1 outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m} className="bg-neutral-900 text-neutral-200">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {isAddingMonth ? (
              <form onSubmit={handleCreateMonth} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="e.g. November 2026"
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  autoFocus
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 outline-none w-36"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMonth(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-300 px-1"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingMonth(true)}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
              >
                + Month
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Days List */}
        {filteredDays.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-900 rounded-2xl">
            <p className="text-sm text-neutral-500">No days added for {activeMonth} yet.</p>
            <p className="text-xs text-neutral-600 mt-1">
              Add your first day below with your self-assigned name.
            </p>
          </div>
        ) : (
          filteredDays.map((day) => (
            <section
              key={day.id}
              className="bg-neutral-900/40 border border-neutral-850 hover:border-neutral-800 rounded-2xl p-5 sm:p-6 transition-all"
            >
              {/* Day Header with user-assigned name */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-5">
                <div className="flex items-center gap-2 flex-1">
                  {editingDayId === day.id ? (
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <input
                        type="text"
                        value={editingDayName}
                        onChange={(e) => setEditingDayName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(day.id);
                        }}
                        className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-sm font-semibold text-white outline-none w-full"
                      />
                      <button
                        onClick={() => handleSaveRename(day.id)}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        {day.name}
                      </h2>
                      <button
                        onClick={() => handleStartRename(day)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 p-1 transition"
                        title="Rename day"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-500">
                    {day.entries.length} {day.entries.length === 1 ? 'block' : 'blocks'}
                  </span>
                  <button
                    onClick={() => handleDeleteDay(day.id)}
                    className="text-neutral-600 hover:text-rose-400 p-1 transition"
                    title="Delete Day"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Time Entries Table / Boxes */}
              <div className="space-y-2.5">
                {/* Column Labels */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 px-1 pb-1">
                  <div className="col-span-3 sm:col-span-2">Start Time</div>
                  <div className="col-span-3 sm:col-span-2">End Time</div>
                  <div className="col-span-5 sm:col-span-7">What work I do</div>
                  <div className="col-span-1 text-right"></div>
                </div>

                {/* Rows with editable input boxes */}
                {day.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-12 gap-2 items-center group"
                  >
                    {/* Start Time Box */}
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="text"
                        placeholder="9:00"
                        value={entry.startTime}
                        onChange={(e) =>
                          handleUpdateEntry(day.id, entry.id, 'startTime', e.target.value)
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-2 text-xs font-mono text-neutral-200 outline-none transition text-center"
                      />
                    </div>

                    {/* End Time Box */}
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="text"
                        placeholder="10:00"
                        value={entry.endTime}
                        onChange={(e) =>
                          handleUpdateEntry(day.id, entry.id, 'endTime', e.target.value)
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-2 text-xs font-mono text-neutral-200 outline-none transition text-center"
                      />
                    </div>

                    {/* What Work I Do Box */}
                    <div className="col-span-5 sm:col-span-7">
                      <input
                        type="text"
                        placeholder="e.g. Book reading, Coding, Reflection..."
                        value={entry.work}
                        onChange={(e) =>
                          handleUpdateEntry(day.id, entry.id, 'work', e.target.value)
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none transition"
                      />
                    </div>

                    {/* Remove Entry */}
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => handleDeleteEntry(day.id, entry.id)}
                        className="text-neutral-600 hover:text-rose-400 p-1 text-sm transition"
                        title="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Time Entry Button under Day */}
              <div className="mt-4 pt-3 border-t border-neutral-850/60 flex items-center justify-between">
                <button
                  onClick={() => handleAddTimeEntry(day.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Add Time Block</span>
                </button>

                <span className="text-[11px] text-neutral-600 font-mono">
                  Auto-saved
                </span>
              </div>
            </section>
          ))
        )}

        {/* Option to Add New Day with Name */}
        <section className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-neutral-300" />
            Add New Day (Assign Custom Name)
          </h3>

          <form onSubmit={handleAddDay} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="e.g. 3 October 2026 or Sunset Day 2"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              className="w-full sm:flex-1 bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 outline-none transition"
            />
            <button
              type="submit"
              disabled={!newDayName.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Day
            </button>
          </form>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs font-mono text-neutral-600">
        ID2950 // Minimal Productivity Log // Self-Assigned Time & Days
      </footer>

    </div>
  );
}
