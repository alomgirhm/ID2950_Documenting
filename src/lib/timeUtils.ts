import { TimeEntry } from '@/types';

/**
 * Calculates raw duration in minutes between start and end time.
 * Handles both 12-hour format (e.g. 11:00 to 1:30, 3:00 to 5:00) and 24-hour format.
 * Examples:
 * - 3:00 to 5:00 -> 120
 * - 3:00 to 5:55 -> 175
 * - 4:15 to 5:00 -> 45
 * - 1:00 to 2:00 -> 60
 */
export function calculateDurationMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 0;

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

  if (startMins === null || endMins === null) return 0;

  let diff = endMins - startMins;

  // Handle 12-hour clock rollover (e.g. 11:00 to 1:30 or 12:00 to 2:00)
  if (diff <= 0) {
    if (diff + 720 > 0 && diff + 720 < 720) {
      diff += 720;
    } else {
      diff += 1440;
    }
  }

  if (diff <= 0 || diff > 1440) return 0;
  return diff;
}

/**
 * Formats a duration in minutes into a human-readable string (e.g. "2 hours", "2h 55m", "45m", "1 hour")
 */
export function formatMinutes(totalMins: number): string {
  if (totalMins <= 0) return '';
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;

  if (hours === 0 && minutes > 0) {
    return `${minutes}m`;
  }
  if (hours > 0 && minutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Automatically calculates formatted duration between start and end time.
 */
export function calculateDuration(startTime?: string, endTime?: string): string {
  const mins = calculateDurationMinutes(startTime, endTime);
  return formatMinutes(mins);
}

/**
 * Calculates total combined duration across all sessions of a day.
 * Includes all entries regardless of mission.
 */
export function calculateDayTotalDuration(entries: TimeEntry[]): string {
  let totalMins = 0;
  entries.forEach((e) => {
    totalMins += calculateDurationMinutes(e.startTime, e.endTime);
  });
  return formatMinutes(totalMins);
}

export interface MissionDuration {
  mission: string;
  duration: string;
  minutes: number;
}

/**
 * Calculates total duration grouped by each mission for a set of time entries.
 * Entries without a mission (empty or whitespace) are NOT attributed to any mission,
 * but remain included in the total day duration.
 */
export function calculateMissionDurations(entries: TimeEntry[]): MissionDuration[] {
  const map: Record<string, number> = {};

  entries.forEach((e) => {
    const missionName = e.mission?.trim();
    if (!missionName) return;

    const mins = calculateDurationMinutes(e.startTime, e.endTime);
    if (mins > 0) {
      map[missionName] = (map[missionName] || 0) + mins;
    }
  });

  return Object.entries(map)
    .filter(([_, mins]) => mins > 0)
    .map(([mission, mins]) => ({
      mission,
      duration: formatMinutes(mins),
      minutes: mins,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

export interface MissionSummaryItem {
  mission: string;
  duration: string;
  minutes: number;
  sessionCount: number;
  percentage: number;
}

export interface DayDetailedStats {
  totalDuration: string;
  totalMinutes: number;
  totalSessions: number;
  missions: MissionSummaryItem[];
  untaggedDuration: string;
  untaggedMinutes: number;
  untaggedCount: number;
}

/**
 * Calculates detailed statistics for day entries including missions breakdown,
 * percentages, session counts, and untagged time.
 */
export function calculateDayDetailedStats(entries: TimeEntry[]): DayDetailedStats {
  let totalMins = 0;
  const missionMap: Record<string, { minutes: number; count: number }> = {};
  let untaggedMins = 0;
  let untaggedCount = 0;

  entries.forEach((e) => {
    const mins = calculateDurationMinutes(e.startTime, e.endTime);
    if (mins > 0) {
      totalMins += mins;
      const mName = e.mission?.trim();
      if (mName) {
        if (!missionMap[mName]) {
          missionMap[mName] = { minutes: 0, count: 0 };
        }
        missionMap[mName].minutes += mins;
        missionMap[mName].count += 1;
      } else {
        untaggedMins += mins;
        untaggedCount += 1;
      }
    }
  });

  const missions: MissionSummaryItem[] = Object.entries(missionMap)
    .map(([mission, data]) => ({
      mission,
      duration: formatMinutes(data.minutes),
      minutes: data.minutes,
      sessionCount: data.count,
      percentage: totalMins > 0 ? Math.round((data.minutes / totalMins) * 100) : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalDuration: formatMinutes(totalMins),
    totalMinutes: totalMins,
    totalSessions: entries.length,
    missions,
    untaggedDuration: formatMinutes(untaggedMins),
    untaggedMinutes: untaggedMins,
    untaggedCount,
  };
}
