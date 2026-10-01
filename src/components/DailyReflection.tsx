'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Sparkles, 
  GlassWater, 
  Moon, 
  Smile, 
  Plus, 
  Trophy, 
  TrendingUp, 
  Save 
} from 'lucide-react';
import { DailyReflection as DailyReflectionType, PriorityItem } from '@/types';

interface DailyReflectionProps {
  priorities: PriorityItem[];
  reflection: DailyReflectionType;
  onUpdatePriorities: (priorities: PriorityItem[]) => void;
  onUpdateReflection: (reflection: DailyReflectionType) => void;
}

const MOODS: ('🔥 Peak' | '⚡ Energized' | '🙂 Good' | '🥱 Tired' | '🧘 Calm')[] = [
  '🔥 Peak',
  '⚡ Energized',
  '🙂 Good',
  '🥱 Tired',
  '🧘 Calm',
];

export const DailyReflection: React.FC<DailyReflectionProps> = ({
  priorities,
  reflection,
  onUpdatePriorities,
  onUpdateReflection,
}) => {
  const [newPriorityText, setNewPriorityText] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const togglePriority = (id: string) => {
    const updated = priorities.map((p) =>
      p.id === id ? { ...p, completed: !p.completed } : p
    );
    onUpdatePriorities(updated);
  };

  const addPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityText.trim()) return;
    const item: PriorityItem = {
      id: `p-${Date.now()}`,
      text: newPriorityText.trim(),
      completed: false,
    };
    onUpdatePriorities([...priorities, item]);
    setNewPriorityText('');
  };

  const removePriority = (id: string) => {
    onUpdatePriorities(priorities.filter((p) => p.id !== id));
  };

  const handleReflectionChange = (
    field: keyof DailyReflectionType,
    val: string | number
  ) => {
    onUpdateReflection({
      ...reflection,
      [field]: val,
    });
  };

  const handleWaterChange = (delta: number) => {
    const newVal = Math.max(0, Math.min(20, reflection.waterGlasses + delta));
    handleReflectionChange('waterGlasses', newVal);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-6">
      
      {/* 1. Daily Priorities */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Daily Top Priorities</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {priorities.filter((p) => p.completed).length} / {priorities.length} Completed
          </span>
        </div>

        <div className="space-y-2 mt-3">
          {priorities.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <button
                type="button"
                onClick={() => togglePriority(item.id)}
                className="flex items-center gap-2.5 text-left flex-1"
              >
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 hover:text-indigo-400 flex-shrink-0" />
                )}
                <span
                  className={`text-xs sm:text-sm ${
                    item.completed ? 'text-slate-400 line-through' : 'text-slate-200'
                  }`}
                >
                  {item.text}
                </span>
              </button>
              <button
                onClick={() => removePriority(item.id)}
                className="text-slate-500 hover:text-rose-400 text-xs px-1.5 transition"
                title="Remove Priority"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Add Priority Form */}
          <form onSubmit={addPriority} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newPriorityText}
              onChange={(e) => setNewPriorityText(e.target.value)}
              placeholder="Add key day objective..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>
      </div>

      {/* 2. Vital Habits Tracker (Hydration, Sleep, Mood) */}
      <div className="pt-4 border-t border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Daily Vitality & Habits
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Hydration */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <GlassWater className="w-4 h-4 text-cyan-400" /> Water
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {reflection.waterGlasses} glasses
              </span>
            </div>
            <div className="flex items-center justify-between mt-2.5 gap-2">
              <button
                onClick={() => handleWaterChange(-1)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold flex items-center justify-center transition"
              >
                -
              </button>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${Math.min(100, (reflection.waterGlasses / 8) * 100)}%` }}
                />
              </div>
              <button
                onClick={() => handleWaterChange(1)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold flex items-center justify-center transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Sleep */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Moon className="w-4 h-4 text-purple-400" /> Sleep
              </span>
              <span className="font-mono text-purple-300 font-bold">
                {reflection.sleepHours} hrs
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={reflection.sleepHours}
              onChange={(e) => handleReflectionChange('sleepHours', parseFloat(e.target.value))}
              className="mt-2.5 w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Mood / Energy */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Smile className="w-4 h-4 text-amber-400" /> State
              </span>
              <span className="text-xs font-semibold text-slate-200">{reflection.mood}</span>
            </div>
            <select
              value={reflection.mood}
              onChange={(e) => handleReflectionChange('mood', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-slate-200 outline-none"
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Evening Reflection & Daily Review */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            Evening Review & Continuous Growth
          </h4>

          {/* Score Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Day Rating:</span>
            <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {reflection.overallScore}%
            </span>
          </div>
        </div>

        <div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={reflection.overallScore}
            onChange={(e) => handleReflectionChange('overallScore', parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              What Went Well Today? (Wins & Breakthroughs)
            </label>
            <textarea
              rows={2}
              value={reflection.wins}
              onChange={(e) => handleReflectionChange('wins', e.target.value)}
              placeholder="e.g. Read 30 pages of Atomic Habits with full focus, executed 2 hours of clean coding..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              What Can I Improve Tomorrow? (1% Optimization)
            </label>
            <textarea
              rows={2}
              value={reflection.improvements}
              onChange={(e) => handleReflectionChange('improvements', e.target.value)}
              placeholder="e.g. Start the morning reading session at 08:30 sharp, avoid phone distractions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

