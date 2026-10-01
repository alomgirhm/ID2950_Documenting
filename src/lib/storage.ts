import { DayData, Project } from '@/types';
import { getInitialDayData, INITIAL_PROJECTS } from './constants';

const DAYS_STORAGE_KEY = 'id2950_days_data_v1';
const PROJECTS_STORAGE_KEY = 'id2950_projects_data_v1';

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadAllDays(): Record<string, DayData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DAYS_STORAGE_KEY);
    if (!raw) {
      const today = getTodayKey();
      const initial = { [today]: getInitialDayData(today) };
      localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load days from storage', e);
    return {};
  }
}

export function saveDayData(dayData: DayData): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllDays();
    all[dayData.date] = dayData;
    localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save day data', e);
  }
}

export function loadDayData(dateStr: string): DayData {
  const all = loadAllDays();
  if (all[dateStr]) {
    return all[dateStr];
  }
  const newDay = getInitialDayData(dateStr);
  saveDayData(newDay);
  return newDay;
}

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load projects from storage', e);
    return INITIAL_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects', e);
  }
}

export function exportDayAsMarkdown(day: DayData, projects: Project[]): string {
  const projectMap = new Map(projects.map((p) => [p.id, p.title]));
  let md = `# ID2950 Daily Productivity Log - ${day.date}\n\n`;

  md += `### 🎯 Top Daily Priorities:\n`;
  day.priorities.forEach((p) => {
    md += `- [${p.completed ? 'x' : ' '}] ${p.text}\n`;
  });

  md += `\n### ⏱️ Time Blocks & Productivity Record:\n`;
  md += `| Time | Activity | Category | Project | Focus (1-5) | Status | Notes |\n`;
  md += `|---|---|---|---|---|---|---|\n`;

  day.timeBlocks.forEach((tb) => {
    const projName = tb.projectId ? projectMap.get(tb.projectId) || '-' : '-';
    const status = tb.completed ? 'Completed' : 'Planned';
    const notes = tb.notes ? tb.notes.replace(/\|/g, '-') : '-';
    md += `| ${tb.startTime} - ${tb.endTime} | ${tb.title} | ${tb.category} | ${projName} | ${'★'.repeat(tb.productivityRating)} | ${status} | ${notes} |\n`;
  });

  md += `\n### 🌟 Evening Reflection:\n`;
  md += `- **Wins:** ${day.reflection.wins || 'N/A'}\n`;
  md += `- **Improvements:** ${day.reflection.improvements || 'N/A'}\n`;
  md += `- **Overall Score:** ${day.reflection.overallScore}/100\n`;
  md += `- **Energy / Mood:** ${day.reflection.mood}\n`;
  md += `- **Sleep:** ${day.reflection.sleepHours} hrs | **Hydration:** ${day.reflection.waterGlasses} glasses\n`;

  return md;
}

