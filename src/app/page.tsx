'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Download, 
  Upload, 
  Smartphone, 
  ClipboardPaste, 
  Files 
} from 'lucide-react';
import { DayLog, TimeEntry, AppUsageItem, DhikrItem } from '@/types';
import { downloadDayPDF, downloadSingleSessionPDF, downloadMultiDayPDF } from '@/lib/pdfExport';

const STORAGE_KEY = 'id2950_clean_canvas_v1';

export const DHIKR_PRESETS = [
  'La ilaha illallah',
  'Astaghfirullah',
  'Subhanallah',
  'Alhamdulillah',
  'Allahu Akbar',
  'Subhanallahi wa bihamdihi',
  'Subhanallahil Azeem',
  'La hawla wa la quwwata illa billah',
  'Durood Sharif',
  'Hasbunallahu wa ni\'mal wakeel',
  'Ayat al-Kursi',
  'Custom...',
];

export function createDefaultDhikr(dayId: string): DhikrItem[] {
  return [
    { id: `dhikr-${dayId}-1`, name: 'La ilaha illallah', count: '' },
    { id: `dhikr-${dayId}-2`, name: 'Astaghfirullah', count: '' },
  ];
}

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
    dhikrList: createDefaultDhikr('day-1'),
  },
];

// Automatically appends ":" after typing the hour (1..12 or 13..24)
// so the user does NOT have to type the colon, while allowing any minutes like 3:30 or 4:00
function formatTimeAutoColon(newVal: string, prevVal: string): string {
  // If user is deleting (backspace), do not auto-append colon
  if (newVal.length < prevVal.length) {
    return newVal;
  }

  const trimmed = newVal.trim();
  if (!trimmed) return '';

  // If already contains colon, keep and sanitize
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length > 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    // Limit minutes to 2 digits max e.g. "3:30"
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}:${parts[1].slice(0, 2)}`;
    }
    return trimmed;
  }

  // Single digit 3 to 9: typing "3" -> "3:", "4" -> "4:", "9" -> "9:"
  if (/^[3-9]$/.test(trimmed)) {
    return `${trimmed}:`;
  }

  // Two digits: 10, 11, 12 (or 13..24, or 01..09) -> "10:", "11:", "12:"
  if (/^(0[1-9]|1[0-9]|2[0-4])$/.test(trimmed)) {
    return `${trimmed}:`;
  }

  // If user typed 1 followed by minutes like 30 (e.g. "130" -> "1:30")
  if (/^([1-9])([0-5]\d)$/.test(trimmed)) {
    return `${trimmed[0]}:${trimmed.slice(1)}`;
  }

  // If user typed e.g. "1030" -> "10:30"
  if (/^(\d{2})([0-5]\d)$/.test(trimmed)) {
    return `${trimmed.slice(0, 2)}:${trimmed.slice(2)}`;
  }

  return trimmed;
}

// On blur, only format if user left an unfinished hour like "3:" or "1"
function formatTimeOnBlur(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return '';

  // Already standard format e.g. "3:30", "4:00"
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed;

  // Single or double digit left without colon e.g. "1" or "2"
  if (/^\d{1,2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  // Trailing colon left without minutes e.g. "3:" -> "3:00"
  if (/^\d{1,2}:$/.test(trimmed)) {
    return `${trimmed}00`;
  }

  // Single minute digit e.g. "3:3" -> "3:30"
  if (/^\d{1,2}:\d$/.test(trimmed)) {
    return `${trimmed}0`;
  }

  return trimmed;
}

// Merge incoming app usage by app name to prevent duplicate rows
function mergeOrUpdateAppUsage(
  current: AppUsageItem[] = [],
  incoming: { appName: string; duration: string }[]
): AppUsageItem[] {
  const result: AppUsageItem[] = [...current];
  incoming.forEach((inc) => {
    const trimmedName = inc.appName.trim();
    if (!trimmedName) return;
    const existingIndex = result.findIndex(
      (a) => a.appName.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        duration: inc.duration.trim() || result[existingIndex].duration,
      };
    } else {
      result.push({
        id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        appName: trimmedName,
        duration: inc.duration.trim(),
      });
    }
  });
  return result;
}

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
  const [expandedWellbeing, setExpandedWellbeing] = useState<Record<string, boolean>>({});
  const [pasteWellbeingDayId, setPasteWellbeingDayId] = useState<string | null>(null);
  const [pasteWellbeingText, setPasteWellbeingText] = useState<string>('');
  const [collapsedDhikr, setCollapsedDhikr] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Toggle Dhikr bar collapse
  const toggleDhikrCollapse = (dayId: string) => {
    setCollapsedDhikr((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  // Multi-Day PDF Export states
  const [isMultiDayExportOpen, setIsMultiDayExportOpen] = useState<boolean>(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(10);
  const [customRangeTitle, setCustomRangeTitle] = useState<string>('');

  // Load from localStorage on mount & clean any legacy corrupted tokens
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: DayLog[] = JSON.parse(stored);
        const cleaned: DayLog[] = parsed.map((d) => ({
          ...d,
          dhikrList:
            d.dhikrList && d.dhikrList.length > 0
              ? d.dhikrList
              : createDefaultDhikr(d.id),
          appUsage: (d.appUsage || []).map((app) => ({
            ...app,
            duration:
              app.duration?.includes('stopwatch') ||
              app.duration?.startsWith('[') ||
              app.duration?.startsWith('{')
                ? ''
                : app.duration,
          })),
        }));
        setDays(cleaned);
        if (cleaned.length > 0 && cleaned[0].month) {
          setActiveMonth(cleaned[0].month);
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
      appUsage: [],
      dhikrList: createDefaultDhikr(`day-${Date.now()}`),
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

  // Handle start and end time inputs with automatic colon (e.g. typing 3 -> 3:, 10 -> 10:)
  const handleUpdateTime = (
    dayId: string,
    entryId: string,
    field: 'startTime' | 'endTime',
    rawVal: string,
    isBlur: boolean = false
  ) => {
    let finalVal = rawVal;
    if (isBlur) {
      finalVal = formatTimeOnBlur(rawVal);
    } else {
      const currentDay = days.find((d) => d.id === dayId);
      const currentEntry = currentDay?.entries.find((e) => e.id === entryId);
      const prevVal = currentEntry ? currentEntry[field] : '';
      finalVal = formatTimeAutoColon(rawVal, prevVal);
    }
    handleUpdateEntry(dayId, entryId, field, finalVal);
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

  // Toggle Digital Wellbeing screen time drawer
  const toggleWellbeing = (dayId: string) => {
    setExpandedWellbeing((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  // Add a new App Screen Time item (or add specific app via chip)
  const handleAddAppUsage = (dayId: string, prefilledAppName: string = '') => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.appUsage || [];
      if (prefilledAppName.trim()) {
        const exists = current.find(
          (a) => a.appName.toLowerCase().trim() === prefilledAppName.toLowerCase().trim()
        );
        if (exists) return d;
      }
      const newItem: AppUsageItem = {
        id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        appName: prefilledAppName,
        duration: '',
      };
      return {
        ...d,
        appUsage: [...current, newItem],
      };
    });
    saveDays(updated);
  };

  // Update an App Screen Time item
  const handleUpdateAppUsage = (
    dayId: string,
    appId: string,
    field: 'appName' | 'duration',
    value: string
  ) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.appUsage || [];
      return {
        ...d,
        appUsage: current.map((a) =>
          a.id === appId ? { ...a, [field]: value } : a
        ),
      };
    });
    saveDays(updated);
  };

  // Remove an App Screen Time item
  const handleRemoveAppUsage = (dayId: string, appId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.appUsage || [];
      return {
        ...d,
        appUsage: current.filter((a) => a.id !== appId),
      };
    });
    saveDays(updated);
  };

  // Parse and import text from Samsung Wellbeing / MacroDroid
  const handleParseAndImportWellbeing = (dayId: string, text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: AppUsageItem[] = [];

    lines.forEach((line) => {
      // Matches formats like "YouTube: 1h 45m" or "YouTube - 45m" or "YouTube 1h 45m"
      const match = line.match(/^([^:-]+)[:\-\t]+(.+)$/);
      if (match) {
        parsed.push({
          id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          appName: match[1].trim(),
          duration: match[2].trim(),
        });
      } else {
        parsed.push({
          id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          appName: line,
          duration: '',
        });
      }
    });

    if (parsed.length > 0) {
      const updated = days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          appUsage: mergeOrUpdateAppUsage(d.appUsage || [], parsed),
        };
      });
      saveDays(updated);
      setPasteWellbeingDayId(null);
      setPasteWellbeingText('');
    }
  };

  // Clear all mobile apps for a day
  const handleClearAllAppUsage = (dayId: string) => {
    const updated = days.map((d) => (d.id === dayId ? { ...d, appUsage: [] } : d));
    saveDays(updated);
  };

  // Add a new Dhikr item to a day
  const handleAddDhikr = (dayId: string, initialName: string = 'Subhanallah') => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.dhikrList || [];
      return {
        ...d,
        dhikrList: [
          ...current,
          {
            id: `dhikr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: initialName,
            count: '',
          },
        ],
      };
    });
    saveDays(updated);
  };

  // Update a Dhikr item (name or count)
  const handleUpdateDhikr = (
    dayId: string,
    dhikrId: string,
    field: 'name' | 'count',
    value: string
  ) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.dhikrList || [];
      return {
        ...d,
        dhikrList: current.map((item) =>
          item.id === dhikrId ? { ...item, [field]: value } : item
        ),
      };
    });
    saveDays(updated);
  };

  // Remove a Dhikr item
  const handleRemoveDhikr = (dayId: string, dhikrId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.dhikrList || [];
      return {
        ...d,
        dhikrList: current.filter((item) => item.id !== dhikrId),
      };
    });
    saveDays(updated);
  };

  // Reset a day's Dhikr back to the default two (La ilaha illallah & Astaghfirullah)
  const handleResetDhikr = (dayId: string) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        dhikrList: createDefaultDhikr(dayId),
      };
    });
    saveDays(updated);
  };

  // Quick increment counter helper (+33, +100)
  const handleQuickIncrementDhikr = (dayId: string, dhikrId: string, amount: number) => {
    const updated = days.map((d) => {
      if (d.id !== dayId) return d;
      const current = d.dhikrList || [];
      return {
        ...d,
        dhikrList: current.map((item) => {
          if (item.id !== dhikrId) return item;
          const currentCountNum = parseInt(item.count.replace(/\D/g, ''), 10);
          const nextVal = isNaN(currentCountNum) ? amount : currentCountNum + amount;
          return { ...item, count: String(nextVal) };
        }),
      };
    });
    saveDays(updated);
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

    if (day.appUsage && day.appUsage.length > 0) {
      const valid = day.appUsage.filter((a) => a.appName.trim());
      if (valid.length > 0) {
        text += '\n📱 Mobile Screen Time (Digital Wellbeing):\n';
        valid.forEach((a) => {
          text += `   • ${a.appName}: ${a.duration || '0m'}\n`;
        });
      }
    }

    if (day.dhikrList && day.dhikrList.length > 0) {
      const validDhikr = day.dhikrList.filter((d) => d.name.trim() && d.count?.trim());
      if (validDhikr.length > 0) {
        text += '\n📿 Daily Dhikr:\n';
        validDhikr.forEach((d) => {
          text += `   • ${d.name}: ${d.count}\n`;
        });
      }
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedDayId(day.id);
      setTimeout(() => setCopiedDayId(null), 2000);
    });
  };


  // Export multiple days as a single combined PDF report
  const handleExportMultiDay = () => {
    if (filteredDays.length === 0) return;
    const start = Math.max(1, Math.min(rangeStart, filteredDays.length));
    const end = Math.max(start, Math.min(rangeEnd, filteredDays.length));
    const slice = filteredDays.slice(start - 1, end);
    const label = customRangeTitle.trim() || `Days ${start} - ${end} (${activeMonth})`;
    downloadMultiDayPDF(slice, label);
    setIsMultiDayExportOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Export all data to JSON file
  const handleExportJSON = () => {
    try {
      const dataToSave = {
        app: 'ID2950_Documenting',
        version: 1,
        exportedAt: new Date().toISOString(),
        totalDays: days.length,
        days: days,
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToSave, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const now = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `ID2950_Documenting_Backup_${now}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupNotice('Backup JSON downloaded successfully!');
      setTimeout(() => setBackupNotice(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Failed to export backup JSON.');
    }
  };

  // Import / Restore data from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.readAsText(files[0], 'UTF-8');
    fileReader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let importedDays: DayLog[] = [];
        if (Array.isArray(parsed)) {
          importedDays = parsed;
        } else if (parsed && Array.isArray(parsed.days)) {
          importedDays = parsed.days;
        } else {
          alert('Invalid backup format. File must contain a days array.');
          return;
        }

        // Clean any corrupted duration strings and ensure dhikrList
        const cleaned: DayLog[] = importedDays.map((d) => ({
          ...d,
          dhikrList:
            d.dhikrList && d.dhikrList.length > 0
              ? d.dhikrList
              : createDefaultDhikr(d.id),
          appUsage: (d.appUsage || []).map((app) => ({
            ...app,
            duration:
              app.duration?.includes('stopwatch') ||
              app.duration?.startsWith('[') ||
              app.duration?.startsWith('{')
                ? ''
                : app.duration,
          })),
        }));

        saveDays(cleaned);
        if (cleaned.length > 0 && cleaned[0].month) {
          setActiveMonth(cleaned[0].month);
        }

        setBackupNotice(`Restored ${cleaned.length} days successfully!`);
        setTimeout(() => setBackupNotice(null), 4000);
      } catch (err) {
        console.error(err);
        alert('Error reading backup file. Please select a valid JSON backup file.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center font-mono text-xs">
        Loading ID2950_Documenting...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-neutral-800">
      
      {/* Top Header */}
      <header className="border-b border-neutral-900 px-4 sm:px-8 lg:px-12 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                ID2950_Documenting
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

            {/* Multi-Day PDF Export Button */}
            <button
              onClick={() => {
                setRangeStart(1);
                setRangeEnd(Math.max(1, Math.min(10, filteredDays.length)));
                setCustomRangeTitle(`Days 1 - ${Math.max(1, Math.min(10, filteredDays.length))}`);
                setIsMultiDayExportOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition font-medium shadow-sm"
              title="Download combined PDF report for multiple days (e.g. Day 1 - 10)"
            >
              <Files className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Day PDF</span>
            </button>

            {/* Backup JSON Button */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition font-medium shadow-sm cursor-pointer"
              title="Download full JSON backup of all days, notes, and screen times"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup</span>
            </button>

            {/* Restore JSON Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition font-medium shadow-sm cursor-pointer"
              title="Restore / Import data from a backup JSON file"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restore</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
          </div>

        </div>
      </header>

      {/* Main Wide & Responsive Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Floating Backup Notification */}
        {backupNotice && (
          <div className="fixed top-5 right-5 z-50 bg-neutral-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{backupNotice}</span>
          </div>
        )}
        
        {/* Multi-Day Export Modal */}
        {isMultiDayExportOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Files className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Download Multi-Day PDF Report
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMultiDayExportOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 text-sm rounded-lg"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Export a continuous, combined PDF report across multiple days at once. Select a day range (e.g. Day 1 - 10, or Day 3 - 8) or choose a quick preset.
              </p>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 block">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRangeStart(1);
                      setRangeEnd(Math.max(1, Math.min(10, filteredDays.length)));
                      setCustomRangeTitle(`Days 1 - ${Math.max(1, Math.min(10, filteredDays.length))}`);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-mono"
                  >
                    Days 1 - 10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRangeStart(1);
                      setRangeEnd(Math.max(1, Math.min(7, filteredDays.length)));
                      setCustomRangeTitle(`Days 1 - ${Math.max(1, Math.min(7, filteredDays.length))}`);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-mono"
                  >
                    Days 1 - 7
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRangeStart(Math.min(3, filteredDays.length));
                      setRangeEnd(Math.max(1, Math.min(8, filteredDays.length)));
                      setCustomRangeTitle(`Days 3 - ${Math.max(1, Math.min(8, filteredDays.length))}`);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-mono"
                  >
                    Days 3 - 8
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRangeStart(1);
                      setRangeEnd(Math.max(1, filteredDays.length));
                      setCustomRangeTitle(`All ${filteredDays.length} Days (${activeMonth})`);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-mono"
                  >
                    All Days (1 - {filteredDays.length})
                  </button>
                </div>
              </div>

              {/* Range Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    From Day (1 to {filteredDays.length}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={filteredDays.length || 1}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    To Day (1 to {filteredDays.length}):
                  </label>
                  <input
                    type="number"
                    min={rangeStart}
                    max={filteredDays.length || 1}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Math.max(rangeStart, parseInt(e.target.value) || rangeStart))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Optional Custom Label */}
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Report Title / Range Label (Optional):
                </label>
                <input
                  type="text"
                  placeholder={`Days ${rangeStart} - ${rangeEnd}`}
                  value={customRangeTitle}
                  onChange={(e) => setCustomRangeTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-xl px-3 py-2 text-xs text-neutral-100 outline-none"
                />
              </div>

              {/* Preview box */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 text-xs font-mono text-neutral-400 flex items-center justify-between">
                <span>Selected: {Math.max(0, Math.min(rangeEnd, filteredDays.length) - Math.min(rangeStart, filteredDays.length) + 1)} Days</span>
                <span className="text-amber-400 font-bold">Month: {activeMonth}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMultiDayExportOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportMultiDay}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Multi-Day PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
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
                              handleUpdateTime(day.id, entry.id, 'startTime', e.target.value, false)
                            }
                            onBlur={(e) =>
                              handleUpdateTime(day.id, entry.id, 'startTime', e.target.value, true)
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
                              handleUpdateTime(day.id, entry.id, 'endTime', e.target.value, false)
                            }
                            onBlur={(e) =>
                              handleUpdateTime(day.id, entry.id, 'endTime', e.target.value, true)
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
                                handleUpdateTime(day.id, entry.id, 'startTime', e.target.value, false)
                              }
                              onBlur={(e) =>
                                handleUpdateTime(day.id, entry.id, 'startTime', e.target.value, true)
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
                                handleUpdateTime(day.id, entry.id, 'endTime', e.target.value, false)
                              }
                              onBlur={(e) =>
                                handleUpdateTime(day.id, entry.id, 'endTime', e.target.value, true)
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

              {/* Daily Dhikr Tracker Bar */}
              <div className="mt-4 pt-3.5 border-t border-neutral-850/70 bg-neutral-950/40 rounded-xl p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-850/80">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">📿</span>
                    <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                      Daily Dhikr
                    </span>
                    {day.dhikrList && day.dhikrList.length > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                        {day.dhikrList.filter((d) => d.count?.trim()).length}/{day.dhikrList.length} recorded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddDhikr(day.id)}
                      className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 transition"
                      title="Add another Dhikr dropdown to track"
                    >
                      <Plus className="w-3 h-3 text-neutral-400" />
                      <span>Add Dhikr</span>
                    </button>

                    {(!day.dhikrList || day.dhikrList.length < 2) && (
                      <button
                        type="button"
                        onClick={() => handleResetDhikr(day.id)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 border border-amber-900/40 transition"
                        title="Reset to default initial two (La ilaha illallah & Astaghfirullah)"
                      >
                        Reset Initial 2
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleDhikrCollapse(day.id)}
                      className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-850 transition"
                      title={collapsedDhikr[day.id] ? "Expand Daily Dhikr" : "Collapse Daily Dhikr"}
                    >
                      {collapsedDhikr[day.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!collapsedDhikr[day.id] && (
                  <>
                    {(!day.dhikrList || day.dhikrList.length === 0) ? (
                      <div className="text-center py-4 border border-dashed border-neutral-850 rounded-xl px-4">
                        <p className="text-xs text-neutral-400 font-mono">
                          No Dhikr currently tracked for this day.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleResetDhikr(day.id)}
                          className="mt-2 text-xs text-amber-400 hover:underline font-mono"
                        >
                          + Restore Initial Two (La ilaha illallah & Astaghfirullah)
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {day.dhikrList.map((item) => {
                          const isKnownPreset = DHIKR_PRESETS.filter(p => p !== 'Custom...').includes(item.name);
                          const isCustom = !isKnownPreset;

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition"
                            >
                              {/* Dhikr Dropdown Select Bar */}
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 min-w-0">
                                  <select
                                    value={isCustom ? 'Custom...' : item.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'Custom...') {
                                        handleUpdateDhikr(day.id, item.id, 'name', '');
                                      } else {
                                        handleUpdateDhikr(day.id, item.id, 'name', val);
                                      }
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-medium outline-none cursor-pointer"
                                  >
                                    {DHIKR_PRESETS.map((preset) => (
                                      <option key={preset} value={preset} className="bg-neutral-900 text-neutral-200">
                                        {preset}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDhikr(day.id, item.id)}
                                  className="text-neutral-500 hover:text-rose-400 p-1.5 text-xs rounded transition cursor-pointer"
                                  title="Remove this Dhikr"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Custom Dhikr Input Field */}
                              {isCustom && (
                                <input
                                  type="text"
                                  placeholder="Type custom Dhikr name..."
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateDhikr(day.id, item.id, 'name', e.target.value)
                                  }
                                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-lg px-2.5 py-1 text-xs text-neutral-100 outline-none"
                                />
                              )}

                              {/* Manual Count / Time Box with quick helpers */}
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Count / time (e.g. 100, 33, 15m)"
                                  value={item.count || ''}
                                  onChange={(e) =>
                                    handleUpdateDhikr(day.id, item.id, 'count', e.target.value)
                                  }
                                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-100 outline-none placeholder:text-neutral-600 transition"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleQuickIncrementDhikr(day.id, item.id, 33)}
                                  className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                                  title="Add +33"
                                >
                                  +33
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickIncrementDhikr(day.id, item.id, 100)}
                                  className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition"
                                  title="Add +100"
                                >
                                  +100
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Day Bottom Actions */}

              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-neutral-850/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleAddTimeEntry(day.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Add Time Block</span>
                  </button>

                  {/* Toggle Mobile Digital Wellbeing Drawer */}
                  <button
                    onClick={() => toggleWellbeing(day.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition shadow-sm ${
                      (day.appUsage && day.appUsage.length > 0) || !!expandedWellbeing[day.id]
                        ? 'bg-neutral-900 border-neutral-700 text-neutral-100'
                        : 'bg-neutral-950 hover:bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Track daily mobile screen time from Samsung Wellbeing"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mobile Screen Time</span>
                    {day.appUsage && day.appUsage.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {day.appUsage.length} apps
                      </span>
                    )}
                  </button>
                </div>

                <span className="text-[11px] text-neutral-600 font-mono">
                  Auto-saved
                </span>
              </div>

              {/* Digital Wellbeing Drawer */}
              {expandedWellbeing[day.id] && (
                <div className="mt-4 pt-4 border-t border-neutral-850/80 bg-neutral-950/60 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-850">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Mobile App Screen Time (Samsung Wellbeing)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAddAppUsage(day.id)}
                        className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
                      >
                        <Plus className="w-3 h-3 text-neutral-400" />
                        <span>Add App</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPasteWellbeingDayId(
                            pasteWellbeingDayId === day.id ? null : day.id
                          );
                        }}
                        className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition"
                        title="Paste screen time text directly from Samsung Wellbeing or MacroDroid"
                      >
                        <ClipboardPaste className="w-3 h-3 text-indigo-400" />
                        <span>Paste / Import</span>
                      </button>

                      {day.appUsage && day.appUsage.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleClearAllAppUsage(day.id)}
                          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/40 transition"
                          title="Clear all tracked apps"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Clear All</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Add Preset Apps */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
                    <span className="text-[11px] font-mono text-neutral-500 mr-1">Quick Add:</span>
                    {['Facebook', 'YouTube', 'WhatsApp', 'ChatGPT', 'Chrome', 'Instagram'].map((appName) => (
                      <button
                        key={appName}
                        type="button"
                        onClick={() => handleAddAppUsage(day.id, appName)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-mono cursor-pointer"
                      >
                        + {appName}
                      </button>
                    ))}
                  </div>

                  {/* Quick Paste Modal / Textarea */}
                  {pasteWellbeingDayId === day.id && (
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 animate-fadeIn">
                      <label className="text-[11px] font-mono text-neutral-400 block">
                        Paste app usage text (e.g. "YouTube: 1h 45m" or "Chrome: 30m"):
                      </label>
                      <textarea
                        rows={3}
                        value={pasteWellbeingText}
                        onChange={(e) => setPasteWellbeingText(e.target.value)}
                        placeholder="YouTube: 1h 45m&#10;Kindle: 50m&#10;Chrome: 30m"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg p-2.5 text-xs text-neutral-200 outline-none font-mono"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPasteWellbeingDayId(null)}
                          className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleParseAndImportWellbeing(day.id, pasteWellbeingText)
                          }
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Import Apps
                        </button>
                      </div>
                    </div>
                  )}

                  {/* App Usage Rows */}
                  {(!day.appUsage || day.appUsage.length === 0) ? (
                    <div className="text-center py-5 border border-dashed border-neutral-850 rounded-xl px-4">
                      <p className="text-xs text-neutral-400 font-mono">
                        No mobile apps documented for this day yet.
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Click a Quick Add button above, or click "+ Add App" to enter the App Name and Time manually from Digital Wellbeing.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Column Labels */}
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-wider px-2">
                        <div className="col-span-7 sm:col-span-7">App Name (e.g. Facebook)</div>
                        <div className="col-span-4 sm:col-span-4 text-center">Time Spent (Digital Wellbeing)</div>
                        <div className="col-span-1 text-right">✕</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {day.appUsage.map((app) => (
                          <div
                            key={app.id}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm"
                          >
                            <input
                              type="text"
                              placeholder="App Name (e.g. Facebook)"
                              value={app.appName}
                              onChange={(e) =>
                                handleUpdateAppUsage(day.id, app.id, 'appName', e.target.value)
                              }
                              className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-100 outline-none transition"
                            />
                            <input
                              type="text"
                              placeholder="Time (e.g. 30m)"
                              value={app.duration}
                              onChange={(e) =>
                                handleUpdateAppUsage(day.id, app.id, 'duration', e.target.value)
                              }
                              className="w-32 bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-100 outline-none text-center transition"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAppUsage(day.id, app.id)}
                              className="text-neutral-500 hover:text-rose-400 p-1.5 text-xs rounded transition cursor-pointer"
                              title="Remove app"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sync Instructions Hint */}
                  <div className="pt-2 text-[10px] text-neutral-500 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>Included in daily PDF report</span>
                    <span>Documented locally on your device</span>
                  </div>
                </div>
              )}
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

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs font-mono text-neutral-600 px-4">
        ID2950_Documenting // Productivity Log // Self-Assigned Time & Days
      </footer>

    </div>
  );
}
