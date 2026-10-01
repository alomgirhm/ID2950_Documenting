export interface TimeEntry {
  id: string;
  startTime: string; // e.g. "3:00"
  endTime: string;   // e.g. "4:00"
  work: string;      // e.g. "$1.3B AI CEO: 'You ONLY Need 2 People and 90 Days to Build a $1M Business' | Higgsfield Founder"
  notes?: string;    // collapsible notes / learnings from video, book, or work
}

export interface DayLog {
  id: string;
  name: string;      // user-defined day name, e.g. "2 October 2026"
  month: string;     // user-defined month, e.g. "October 2026"
  entries: TimeEntry[];
}
