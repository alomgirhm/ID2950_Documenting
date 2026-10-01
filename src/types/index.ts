export type ActivityCategory = 
  | 'Reading' 
  | 'Coding' 
  | 'Deep Work' 
  | 'Fitness' 
  | 'Mindfulness' 
  | 'Learning' 
  | 'Personal' 
  | 'Rest';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  targetHours: number;
  color: string;
  milestones: Milestone[];
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  title: string;     // "Book reading"
  category: ActivityCategory;
  projectId?: string;
  notes?: string;
  productivityRating: number; // 1 to 5
  completed: boolean;
}

export interface PriorityItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyReflection {
  wins: string;
  improvements: string;
  overallScore: number; // 1-100
  sleepHours: number;
  waterGlasses: number;
  mood: '🔥 Peak' | '⚡ Energized' | '🙂 Good' | '🥱 Tired' | '🧘 Calm';
}

export interface DayData {
  date: string; // YYYY-MM-DD
  priorities: PriorityItem[];
  reflection: DailyReflection;
  timeBlocks: TimeBlock[];
}

