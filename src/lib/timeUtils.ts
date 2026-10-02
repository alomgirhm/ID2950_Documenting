import { TimeEntry } from '@/types';

/**
 * Automatically calculates duration between start and end time.
 * Handles both 12-hour format (e.g. 11:00 to 1:30, 3:00 to 5:00) and 24-hour format.
 * Examples:
 * - 3:00 to 5:00 -> "2 hours"
 * - 3:00 to 5:55 -> "2h 55m"
 * - 4:15 to 5:00 -> "45m"
 * - 1:00 to 2:00 -> "1 hour"
 */
export function calculateDuration(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '';

  const parseToMinutes = (str: string): number | null => {
    const clean = str.trim().toLowerCase();
    if (!clean) return null;
    const parts = clean.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(h)) return null;
    return h * 60 + (isNaN(m) ? 0 : m);
  };

  const startMins = parseToMinutes(startTime);
  const endMins = parseToMinutes(endTime);

  if (startMins === null || endMins === null) return '';

  let diff = endMins - startMins;

  // Handle 12-hour clock rollover (e.g. 11:00 to 1:30 or 12:00 to 2:00)
  if (diff <= 0) {
    if (diff + 720 > 0 && diff + 720 < 720) {
      diff += 720;
    } else {
      diff += 1440;
    }
  }

  if (diff <= 0 || diff > 1440) return '';

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours === 0 && minutes > 0) {
    return `${minutes}m`;
  }
  if (hours > 0 && minutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Calculates total combined duration across all sessions of a day
 */
export function calculateDayTotalDuration(entries: TimeEntry[]): string {
  let totalMins = 0;
  entries.forEach((e) => {
    if (!e.startTime || !e.endTime) return;
    const durStr = calculateDuration(e.startTime, e.endTime);
    if (!durStr) return;

    let h = 0;
    let m = 0;
    if (durStr.includes('hour')) {
      const match = durStr.match(/(\d+)\s*hour/);
      if (match) h = parseInt(match[1], 10);
    } else if (durStr.includes('h')) {
      const matchH = durStr.match(/(\d+)h/);
      if (matchH) h = parseInt(matchH[1], 10);
      const matchM = durStr.match(/(\d+)m/);
      if (matchM) m = parseInt(matchM[1], 10);
    } else if (durStr.includes('m')) {
      const match = durStr.match(/(\d+)m/);
      if (match) m = parseInt(match[1], 10);
    }
    totalMins += h * 60 + m;
  });

  if (totalMins <= 0) return '';
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hours}h ${minutes}m`;
}
