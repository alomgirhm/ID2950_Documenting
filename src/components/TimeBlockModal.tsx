'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, BookOpen, Code2, Brain, Sparkles, Check, Trash2 } from 'lucide-react';
import { ActivityCategory, Project, TimeBlock } from '@/types';

interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: TimeBlock) => void;
  onDelete?: (blockId: string) => void;
  initialBlock?: TimeBlock | null;
  projects: Project[];
}

const CATEGORIES: ActivityCategory[] = [
  'Reading',
  'Coding',
  'Deep Work',
  'Fitness',
  'Learning',
  'Mindfulness',
  'Personal',
  'Rest',
];

export const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialBlock,
  projects,
}) => {
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [title, setTitle] = useState<string>('Book reading');
  const [category, setCategory] = useState<ActivityCategory>('Reading');
  const [projectId, setProjectId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [productivityRating, setProductivityRating] = useState<number>(5);
  const [completed, setCompleted] = useState<boolean>(true);

  useEffect(() => {
    if (initialBlock) {
      setStartTime(initialBlock.startTime);
      setEndTime(initialBlock.endTime);
      setTitle(initialBlock.title);
      setCategory(initialBlock.category);
      setProjectId(initialBlock.projectId || '');
      setNotes(initialBlock.notes || '');
      setProductivityRating(initialBlock.productivityRating || 5);
      setCompleted(initialBlock.completed);
    } else {
      // Default new block
      setStartTime('09:00');
      setEndTime('10:00');
      setTitle('Book reading');
      setCategory('Reading');
      setProjectId(projects[0]?.id || '');
      setNotes('');
      setProductivityRating(5);
      setCompleted(true);
    }
  }, [initialBlock, projects, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const block: TimeBlock = {
      id: initialBlock ? initialBlock.id : `tb-${Date.now()}`,
      startTime,
      endTime,
      title: title.trim(),
      category,
      projectId: projectId || undefined,
      notes: notes.trim() || undefined,
      productivityRating,
      completed,
    };

    onSave(block);
    onClose();
  };

  const applyPreset = (presetTitle: string, presetCat: ActivityCategory, defaultNotes?: string) => {
    setTitle(presetTitle);
    setCategory(presetCat);
    if (defaultNotes) setNotes(defaultNotes);
    // Find matching project
    const match = projects.find((p) => p.category === presetCat);
    if (match) setProjectId(match.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-100">
              {initialBlock ? 'Edit Productivity Time Block' : 'Log New Daily Time Block'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('Book reading', 'Reading', 'Read chapters & note takeaways')}
            className="px-2.5 py-1 rounded-md bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 text-xs whitespace-nowrap transition flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            Book reading
          </button>
          <button
            type="button"
            onClick={() => applyPreset('Deep Work: Coding & Architecture', 'Coding', 'Sprint on ID2950 implementation')}
            className="px-2.5 py-1 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 text-xs whitespace-nowrap transition flex items-center gap-1"
          >
            <Code2 className="w-3 h-3" />
            Coding Work
          </button>
          <button
            type="button"
            onClick={() => applyPreset('Learning & Skill Mastery', 'Learning', 'System design & algorithmic patterns')}
            className="px-2.5 py-1 rounded-md bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 text-xs whitespace-nowrap transition flex items-center gap-1"
          >
            <Brain className="w-3 h-3" />
            Learning
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Activity Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Book reading, Next.js Development, Morning Workout..."
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Category & Project Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Linked Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">None (General)</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Productivity Rating (Stars) & Completed Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Focus & Productivity Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setProductivityRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= productivityRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600 hover:text-slate-500'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2 font-mono">
                  {productivityRating}/5
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900"
              />
              <span className="text-xs font-semibold text-slate-300">
                Mark as Completed
              </span>
            </label>
          </div>

          {/* Notes / Takeaways */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notes & Key Insights
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What did you learn? Pages read, problems solved, or insights gained..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {initialBlock && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this time block?')) {
                    onDelete(initialBlock.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-2 px-3 rounded-lg hover:bg-rose-950/30 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Block</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
              >
                <Check className="w-4 h-4" />
                {initialBlock ? 'Update Block' : 'Save Block'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

