'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Edit2, 
  Check, 
  Sunset, 
  Copy, 
  CheckCheck, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Download
} from 'lucide-react';
import { DayLog, TimeEntry } from '@/types';
import { downloadDayPDF, downloadSingleSessionPDF } from '@/lib/pdfExport';

const STORAGE_KEY = 'id2950_clean_canvas_v1';

const DEFAULT_DAYS: DayLog[] = [
  {
    id: 'day-1',
    name: '',
    month: 'October 2026',
    entries: [
      {
        id: 'entry-1',
        startTime: '',
        endTime: '',
        work: '',
        notes: '',
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
  const [copiedDayId, setCopiedDayId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
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

  // Toggle notes dropdown for a specific entry
  const toggleNotes = (entryId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

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
          startTime: '',
          endTime: '',
          work: '',
          notes: '',
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
    const newEntryId = `entry-${Date.now()}`;
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const newEntry: TimeEntry = {
        id: newEntryId,
        startTime: '',
        endTime: '',
        work: '',
        notes: '',
      };
      return {
        ...d,
        entries: [...d.entries, newEntry],
      };
    });
    saveDays(updated);
    // Auto-open notes for newly added entry
    setExpandedNotes((prev) => ({ ...prev, [newEntryId]: false }));
  };

  // Update a specific Time Entry
  const handleUpdateEntry = (
    dayId: string,
    entryId: string,
    field: 'startTime' | 'endTime' | 'work' | 'notes',
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

  // Helper to get works list as array of strings
  const getWorksList = (entry: TimeEntry): string[] => {
    if (entry.works && entry.works.length > 0) return entry.works;
    return entry.work ? [entry.work] : [''];
  };

  // Update specific work item in the numbered list
  const handleUpdateWorkItem = (
    dayId: string,
    entryId: string,
    workIndex: number,
    value: string
  ) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        entries: d.entries.map((entry) => {
          if (entry.id !== entryId) return entry;
          const currentWorks = getWorksList(entry);
          const newWorks = [...currentWorks];
          newWorks[workIndex] = value;
          return {
            ...entry,
            work: newWorks.filter(Boolean).join('; '),
            works: newWorks,
          };
        }),
      };
    });
    saveDays(updated);
  };

  // Add another numbered work item to the session
  const handleAddWorkItem = (dayId: string, entryId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        entries: d.entries.map((entry) => {
          if (entry.id !== entryId) return entry;
          const currentWorks = getWorksList(entry);
          const newWorks = [...currentWorks, ''];
          return {
            ...entry,
            works: newWorks,
          };
        }),
      };
    });
    saveDays(updated);
  };

  // Remove a numbered work item
  const handleRemoveWorkItem = (dayId: string, entryId: string, workIndex: number) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        entries: d.entries.map((entry) => {
          if (entry.id !== entryId) return entry;
          const currentWorks = getWorksList(entry);
          const newWorks = currentWorks.filter((_, idx) => idx !== workIndex);
          const finalWorks = newWorks.length > 0 ? newWorks : [''];
          return {
            ...entry,
            work: finalWorks.filter(Boolean).join('; '),
            works: finalWorks,
          };
        }),
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

  // Copy day entries to clipboard as clean text (with multiple numbered works & notes)
  const handleCopyDay = (day: DayLog) => {
    let text = `${day.name || 'Untitled Day'} (${day.month})\n`;
    text += '====================================\n';
    day.entries.forEach((e) => {
      const works = getWorksList(e).filter((w) => w.trim().length > 0);
      if (works.length > 1) {
        text += `[${e.startTime || '--:--'} - ${e.endTime || '--:--'}]\n`;
        works.forEach((w, i) => {
          text += `   ${i + 1}. ${w}\n`;
        });
      } else {
        text += `[${e.startTime || '--:--'} - ${e.endTime || '--:--'}] ${works[0] || e.work || '(no work specified)'}\n`;
      }
      if (e.notes && e.notes.trim()) {
        const indentedNotes = e.notes
          .split('\n')
          .map((line) => `    ↳ ${line}`)
          .join('\n');
        text += `${indentedNotes}\n`;
      }
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDayId(day.id);
      setTimeout(() => setCopiedDayId(null), 2000);
    });
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
      <header className="border-b border-neutral-900 px-4 sm:px-8 lg:px-12 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                ID2950
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                minimal
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <Sunset className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" />
              <span>Self-defined days & custom time tracking (Starts at sunset or whenever you define)</span>
            </p>
          </div>

          {/* Simple Month Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 ml-2 flex-shrink-0" />
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 font-medium px-2 py-1.5 outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m} className="bg-neutral-900 text-neutral-200">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {isAddingMonth ? (
              <form onSubmit={handleCreateMonth} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. November 2026"
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  autoFocus
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 outline-none w-36 sm:w-44 focus:border-neutral-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMonth(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-300 p-1.5"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingMonth(true)}
                className="text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition font-medium"
              >
                + Month
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Wide & Responsive Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Days List */}
        {filteredDays.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-900 rounded-2xl px-4">
            <p className="text-sm font-medium text-neutral-400">No days added for {activeMonth} yet.</p>
            <p className="text-xs text-neutral-600 mt-1">
              Add your first day below with your self-assigned name.
            </p>
          </div>
        ) : (
          filteredDays.map((day) => (
            <section
              key={day.id}
              className="bg-neutral-900/40 border border-neutral-850 hover:border-neutral-800 rounded-2xl p-4 sm:p-6 lg:p-7 transition-all shadow-sm"
            >
              {/* Day Header with user-assigned name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800/80 mb-4 sm:mb-5 gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {editingDayId === day.id ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input
                        type="text"
                        value={editingDayName}
                        onChange={(e) => setEditingDayName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(day.id);
                        }}
                        className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-sm sm:text-base font-semibold text-white outline-none w-full"
                      />
                      <button
                        onClick={() => handleSaveRename(day.id)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 group">
                      <h2 className="text-base sm:text-xl font-bold text-white tracking-wide">
                        {day.name}
                      </h2>
                      <button
                        onClick={() => handleStartRename(day)}
                        className="text-neutral-500 hover:text-neutral-300 p-1 rounded transition"
                        title="Rename day"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                  <span className="text-xs font-mono text-neutral-500">
                    {day.entries.length} {day.entries.length === 1 ? 'block' : 'blocks'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Day Log */}
                    <button
                      onClick={() => handleCopyDay(day)}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 transition"
                      title="Copy Day Summary (Includes Notes)"
                    >
                      {copiedDayId === day.id ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-[11px] hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>

                    {/* Download Day PDF */}
                    <button
                      onClick={() => downloadDayPDF(day)}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 transition"
                      title="Download Full Day Report as PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-[11px] hidden sm:inline">PDF</span>
                    </button>

                    {/* Delete Day */}
                    <button
                      onClick={() => handleDeleteDay(day.id)}
                      className="text-neutral-500 hover:text-rose-400 p-2 rounded-lg hover:bg-neutral-800/40 transition"
                      title="Delete Day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Entries Table / Boxes */}
              <div className="space-y-3.5">
                
                {/* Column Headers for Medium & Wide screens */}
                <div className="hidden sm:grid grid-cols-12 gap-3 text-[11px] font-mono uppercase tracking-wider text-neutral-500 px-1 pb-1">
                  <div className="col-span-2 lg:col-span-2">Start Time</div>
                  <div className="col-span-2 lg:col-span-2">End Time</div>
                  <div className="col-span-6 lg:col-span-6">What work I do</div>
                  <div className="col-span-1 lg:col-span-1 text-center">Notes</div>
                  <div className="col-span-1 lg:col-span-1 text-right">Remove</div>
                </div>

                {/* Rows with editable input boxes and collapsible notes */}
                {day.entries.map((entry, index) => {
                  const isNotesOpen = !!expandedNotes[entry.id];
                  const hasNotes = Boolean(entry.notes && entry.notes.trim().length > 0);

                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-neutral-850 hover:border-neutral-800/90 bg-neutral-950/40 transition overflow-hidden"
                    >
                      
                      {/* Desktop / Wide layout (sm and up) */}
                      <div className="hidden sm:grid grid-cols-12 gap-3 items-center p-3">
                        
                        {/* Start Time Box */}
                        <div className="col-span-2 lg:col-span-2">
                          <input
                            type="text"
                            placeholder="Start"
                            value={entry.startTime}
                            onChange={(e) =>
                              handleUpdateEntry(day.id, entry.id, 'startTime', e.target.value)
                            }
                            className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-neutral-200 outline-none transition text-center"
                          />
                        </div>

                        {/* End Time Box */}
                        <div className="col-span-2 lg:col-span-2">
                          <input
                            type="text"
                            placeholder="End"
                            value={entry.endTime}
                            onChange={(e) =>
                              handleUpdateEntry(day.id, entry.id, 'endTime', e.target.value)
                            }
                            className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-neutral-200 outline-none transition text-center"
                          />
                        </div>

                        {/* What Work I Do Box (Multiple Numbered Works Supported) */}
                        <div className="col-span-6 lg:col-span-6 space-y-2">
                          {getWorksList(entry).map((workItem, wIdx, arr) => (
                            <div key={wIdx} className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 min-w-[26px] text-center select-none flex-shrink-0">
                                {wIdx + 1}.
                              </span>
                              <input
                                type="text"
                                placeholder={`What work I do #${wIdx + 1}...`}
                                value={workItem}
                                onChange={(e) =>
                                  handleUpdateWorkItem(day.id, entry.id, wIdx, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddWorkItem(day.id, entry.id);
                                  }
                                }}
                                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-200 outline-none transition"
                              />
                              {arr.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkItem(day.id, entry.id, wIdx)}
                                  className="text-neutral-500 hover:text-rose-400 p-1.5 text-xs rounded transition flex-shrink-0"
                                  title={`Remove work #${wIdx + 1}`}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddWorkItem(day.id, entry.id)}
                            className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition pl-1 py-0.5"
                            title="Add multiple work items in this time slot (e.g. 3:00 - 4:00)"
                          >
                            <Plus className="w-3 h-3 text-neutral-500" />
                            <span>+ Add work #{getWorksList(entry).length + 1}</span>
                          </button>
                        </div>

                        {/* Dropable Notes Toggle Button */}
                        <div className="col-span-1 lg:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleNotes(entry.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
                              hasNotes
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                            }`}
                            title={isNotesOpen ? 'Collapse Notes' : 'Open Notes & Learnings'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isNotesOpen ? (
                              <ChevronUp className="w-3 h-3 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        </div>

                        {/* Remove Entry */}
                        <div className="col-span-1 lg:col-span-1 text-right">
                          <button
                            onClick={() => handleDeleteEntry(day.id, entry.id)}
                            className="text-neutral-500 hover:text-rose-400 p-2 text-sm rounded-lg hover:bg-neutral-800 transition"
                            title="Delete entry"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Mobile Friendly Layout (Screen < 640px) */}
                      <div className="sm:hidden p-3 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span>Block #{index + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleNotes(entry.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono transition ${
                                hasNotes
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{isNotesOpen ? 'Close' : 'Notes'}</span>
                              {isNotesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            <button
                              onClick={() => handleDeleteEntry(day.id, entry.id)}
                              className="text-neutral-500 hover:text-rose-400 px-2 py-1 text-xs rounded transition"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Start and End side-by-side on mobile */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                              Start Time
                            </label>
                            <input
                              type="text"
                              placeholder="Start"
                              value={entry.startTime}
                              onChange={(e) =>
                                handleUpdateEntry(day.id, entry.id, 'startTime', e.target.value)
                              }
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-2 text-xs font-mono text-neutral-200 outline-none text-center"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                              End Time
                            </label>
                            <input
                              type="text"
                              placeholder="End"
                              value={entry.endTime}
                              onChange={(e) =>
                                handleUpdateEntry(day.id, entry.id, 'endTime', e.target.value)
                              }
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-2 text-xs font-mono text-neutral-200 outline-none text-center"
                            />
                          </div>
                        </div>

                        {/* What Work I Do on mobile (with numbered works) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-mono text-neutral-500 block">
                              What work I do
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddWorkItem(day.id, entry.id)}
                              className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add work #{getWorksList(entry).length + 1}</span>
                            </button>
                          </div>

                          {getWorksList(entry).map((workItem, wIdx, arr) => (
                            <div key={wIdx} className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 py-1 min-w-[22px] text-center select-none flex-shrink-0">
                                {wIdx + 1}.
                              </span>
                              <input
                                type="text"
                                placeholder={`Work item #${wIdx + 1}...`}
                                value={workItem}
                                onChange={(e) =>
                                  handleUpdateWorkItem(day.id, entry.id, wIdx, e.target.value)
                                }
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none"
                              />
                              {arr.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkItem(day.id, entry.id, wIdx)}
                                  className="text-neutral-500 hover:text-rose-400 p-1 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dropable Notes & Learnings Drawer */}
                      {isNotesOpen && (
                        <div className="px-3 sm:px-4 pb-3.5 pt-2 bg-neutral-950/80 border-t border-neutral-850/80 transition-all">
                          <div className="flex items-center justify-between pb-1.5">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 font-semibold">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Learnings & Notes from this session
                            </label>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              Markdown / bullets supported
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            value={entry.notes || ''}
                            onChange={(e) =>
                              handleUpdateEntry(day.id, entry.id, 'notes', e.target.value)
                            }
                            placeholder="Write your learnings, takeaways, or notes here..."
                            className="w-full bg-neutral-900/90 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-200 outline-none leading-relaxed resize-y min-h-[75px]"
                          />

                          {/* Session PDF Action & Metadata */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 mt-1 border-t border-neutral-850/60">
                            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Completed Session: {entry.startTime || '--:--'} — {entry.endTime || '--:--'} | {day.name}
                            </span>

                            <button
                              type="button"
                              onClick={() => downloadSingleSessionPDF(day, entry)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-medium transition shadow-sm self-start sm:self-auto"
                              title="Download this session's notes as a PDF document"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span>Download Session PDF</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Add Time Entry Button under Day */}
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-neutral-850/60 flex items-center justify-between">
                <button
                  onClick={() => handleAddTimeEntry(day.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 transition shadow-sm"
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
        <section className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 lg:p-7 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-neutral-300" />
            Add New Day (Assign Custom Name)
          </h3>

          <form onSubmit={handleAddDay} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Assign day name..."
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              className="w-full sm:flex-1 bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl px-4 py-2.5 sm:py-3 text-sm text-neutral-100 outline-none transition"
            />
            <button
              type="submit"
              disabled={!newDayName.trim()}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              Add Day
            </button>
          </form>
        </section>

      </main>

      {/* Minimal Wide Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs font-mono text-neutral-600 px-4">
        ID2950 // Minimal Productivity Log // Self-Assigned Time & Days
      </footer>

    </div>
  );
}
