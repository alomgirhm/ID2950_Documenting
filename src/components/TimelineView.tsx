'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  Code2, 
  Brain, 
  Dumbbell, 
  Sparkles, 
  Coffee, 
  UserCheck, 
  Edit3, 
  Plus, 
  Star,
  FolderGit2
} from 'lucide-react';
import { TimeBlock, Project, ActivityCategory } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';

interface TimelineViewProps {
  timeBlocks: TimeBlock[];
  projects: Project[];
  onToggleComplete: (blockId: string) => void;
  onEditBlock: (block: TimeBlock) => void;
  onQuickAdd: (startTime: string, endTime: string, title: string, category: ActivityCategory) => void;
  onOpenModal: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeBlocks,
  projects,
  onToggleComplete,
  onEditBlock,
  onQuickAdd,
  onOpenModal,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickStart, setQuickStart] = useState('09:00');
  const [quickEnd, setQuickEnd] = useState('10:00');
  const [quickCategory, setQuickCategory] = useState<ActivityCategory>('Reading');

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'Reading':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Coding':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'Deep Work':
        return <Brain className="w-3.5 h-3.5" />;
      case 'Fitness':
        return <Dumbbell className="w-3.5 h-3.5" />;
      case 'Mindfulness':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Learning':
        return <Brain className="w-3.5 h-3.5" />;
      case 'Rest':
        return <Coffee className="w-3.5 h-3.5" />;
      default:
        return <UserCheck className="w-3.5 h-3.5" />;
    }
  };

  // Sort blocks chronologically
  const sortedBlocks = [...timeBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAdd(quickStart, quickEnd, quickTitle.trim(), quickCategory);
    setQuickTitle('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Daily Time Log & Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track and audit how every hour of your day was invested.
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Time Block</span>
        </button>
      </div>

      {/* Quick Add Banner */}
      <form
        onSubmit={handleQuickSubmit}
        className="my-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center gap-2.5 text-xs"
      >
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] whitespace-nowrap">
          Quick Log:
        </span>
        <input
          type="time"
          value={quickStart}
          onChange={(e) => setQuickStart(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none"
        />
        <span className="text-slate-500">-</span>
        <input
          type="time"
          value={quickEnd}
          onChange={(e) => setQuickEnd(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none"
        />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="e.g. Book reading (Atomic Habits)"
          className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
        />
        <select
          value={quickCategory}
          onChange={(e) => setQuickCategory(e.target.value as ActivityCategory)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 outline-none"
        >
          <option value="Reading">Reading</option>
          <option value="Coding">Coding</option>
          <option value="Deep Work">Deep Work</option>
          <option value="Learning">Learning</option>
          <option value="Fitness">Fitness</option>
          <option value="Mindfulness">Mindfulness</option>
          <option value="Personal">Personal</option>
          <option value="Rest">Rest</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
        >
          Add
        </button>
      </form>

      {/* Timeline List */}
      <div className="space-y-3 mt-4">
        {sortedBlocks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No time blocks logged for this day yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Start by logging an activity like "09:00 - 10:00 Book reading".
            </p>
            <button
              onClick={onOpenModal}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
            >
              Add First Block
            </button>
          </div>
        ) : (
          sortedBlocks.map((block) => {
            const catStyle = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.Personal;
            const project = block.projectId ? projectMap.get(block.projectId) : undefined;

            return (
              <div
                key={block.id}
                className={`group relative rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                  block.completed
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/90 border-indigo-500/30 shadow-md shadow-indigo-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Checkbox + Time + Content */}
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onToggleComplete(block.id)}
                      className="mt-0.5 text-slate-500 hover:text-indigo-400 transition"
                      title={block.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {block.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Time Badge */}
                        <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
                          {block.startTime} — {block.endTime}
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {getCategoryIcon(block.category)}
                          {block.category}
                        </span>

                        {/* Project Tag */}
                        {project && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-800">
                            <FolderGit2 className="w-3 h-3 text-indigo-400" />
                            {project.title}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-sm sm:text-base font-bold ${
                          block.completed ? 'text-slate-200' : 'text-white'
                        }`}
                      >
                        {block.title}
                      </h4>

                      {/* Notes / Takeaways */}
                      {block.notes && (
                        <p className="text-xs text-slate-400 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 leading-relaxed font-normal">
                          {block.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Rating & Edit */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5" title={`Focus score: ${block.productivityRating}/5`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= block.productivityRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => onEditBlock(block)}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Block"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

