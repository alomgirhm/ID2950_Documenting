export interface TimeEntry {
  id: string;
  startTime: string; // e.g. "9:00"
  endTime: string;   // e.g. "10:00"
  work: string;      // e.g. "Book reading"
}

export interface DayLog {
  id: string;
  name: string;      // user-defined day name, e.g. "2 October 2026" or "Sunset Day 1"
  month: string;     // user-defined month, e.g. "October 2026"
  entries: TimeEntry[];
}
