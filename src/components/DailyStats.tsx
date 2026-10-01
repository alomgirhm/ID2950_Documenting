'use client';

import React from 'react';
import { 
  Zap, 
  Clock, 
  Star, 
  CheckCircle, 
  BarChart3, 
  Flame,
  BookOpen,
  Code2
} from 'lucide-react';
import { TimeBlock, ActivityCategory } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';

interface DailyStatsProps {
  timeBlocks: TimeBlock[];
  overallScore: number;
}

export const DailyStats: React.FC<DailyStatsProps> = ({ timeBlocks, overallScore }) => {
  // Compute minutes per block
  const getMinutes = (block: TimeBlock) => {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    return Math.max(0, eh * 60 + em - (sh * 60 + sm));
  };

  const totalMinutes = timeBlocks.reduce((acc, b) => acc + getMinutes(b), 0);
  const completedMinutes = timeBlocks
    .filter((b) => b.completed)
    .reduce((acc, b) => acc + getMinutes(b), 0);

  const productiveMinutes = timeBlocks
    .filter((b) => b.completed && ['Reading', 'Coding', 'Deep Work', 'Learning', 'Fitness'].includes(b.category))
    .reduce((acc, b) => acc + getMinutes(b), 0);

  const completedBlocksCount = timeBlocks.filter((b) => b.completed).length;

  const avgRating =
    timeBlocks.length > 0
      ? (
          timeBlocks.reduce((acc, b) => acc + (b.productivityRating || 5), 0) /
          timeBlocks.length
        ).toFixed(1)
      : '5.0';

  // Category Breakdown minutes
  const categoryMinutes: Record<string, number> = {};
  timeBlocks.forEach((b) => {
    const m = getMinutes(b);
    categoryMinutes[b.category] = (categoryMinutes[b.category] || 0) + m;
  });

  const readingMinutes = categoryMinutes['Reading'] || 0;
  const codingMinutes = categoryMinutes['Coding'] || 0;

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* Card 1: Productive Focus Hours */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Productive Focus</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white font-mono">
            {formatHours(productiveMinutes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold font-mono">
              {totalMinutes > 0 ? Math.round((productiveMinutes / totalMinutes) * 100) : 0}%
            </span>
            of scheduled day
          </p>
        </div>
      </div>

      {/* Card 2: Book Reading & Learning */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Reading & Growth</span>
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatHours(readingMinutes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            Active Reading Habit
          </p>
        </div>
      </div>

      {/* Card 3: Execution & Completion */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Blocks Completed</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white font-mono">
            {completedBlocksCount} <span className="text-sm font-normal text-slate-400">/ {timeBlocks.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-indigo-400 font-semibold font-mono">
              {timeBlocks.length > 0 ? Math.round((completedBlocksCount / timeBlocks.length) * 100) : 0}%
            </span>
            completion rate
          </p>
        </div>
      </div>

      {/* Card 4: Daily Productivity Rating */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Day Score & Quality</span>
          <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
            <Star className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-pink-400 font-mono">
            {overallScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {avgRating} / 5.0 Avg Rating
          </p>
        </div>
      </div>

    </div>
  );
};

