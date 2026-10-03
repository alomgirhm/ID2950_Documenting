export interface TimeEntry {
  id: string;
  startTime: string; // e.g. "3:00"
  endTime: string;   // e.g. "4:00"
  mission?: string;  // e.g. "ID2950", "Coding", or custom user-created mission
  work: string;      // main work or summary
  works?: string[];  // multiple numbered works in the same session: ["Work 1", "Work 2", ...]
  notes?: string;    // collapsible notes / learnings from video, book, or work
}

export interface AppUsageItem {
  id: string;
  appName: string; // e.g. "YouTube", "Kindle", "Chrome"
  duration: string; // e.g. "1h 45m" or "35m"
}

export interface DhikrItem {
  id: string;
  name: string;      // e.g. "La ilaha illallah", "Astaghfirullah", or custom
  count: string;     // manual count or time, e.g. "100", "33", "15 mins"
}

export interface DayLog {
  id: string;
  name: string;      // user-defined day name, e.g. "2 October 2026"
  month: string;     // user-defined month, e.g. "October 2026"
  entries: TimeEntry[];
  appUsage?: AppUsageItem[]; // Digital Wellbeing screen time
  dhikrList?: DhikrItem[];   // Daily Dhikr tracker
}

