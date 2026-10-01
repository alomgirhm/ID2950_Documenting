'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Share2, 
  PlusCircle, 
  Timer, 
  Sparkles,
  CheckCheck
} from 'lucide-react';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onOpenNewBlockModal: () => void;
  onToggleTimer: () => void;
  isTimerActive: boolean;
  onExportMarkdown: () => void;
  productivityScore: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onOpenNewBlockModal,
  onToggleTimer,
  isTimerActive,
  onExportMarkdown,
  productivityScore,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const d = new Date();
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleCopyMarkdown = () => {
    onExportMarkdown();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDisplayDate = () => {
    try {
      const [y, m, d] = currentDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return currentDate;
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-black text-sm tracking-tighter bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                  ID
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">ID2950</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-widest uppercase">
                  V1.0 OS
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Personal Productivity Engine
              </p>
            </div>
          </div>

          {/* Productivity Score Pill for mobile/header */}
          <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <span className="text-xs text-slate-400">Score</span>
            <span className={`text-xs font-bold ${productivityScore >= 80 ? 'text-emerald-400' : productivityScore >= 60 ? 'text-amber-400' : 'text-slate-300'}`}>
              {productivityScore}%
            </span>
          </div>
        </div>

        {/* Center: Date Navigation */}
        <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200 min-w-[130px] text-center select-none">
              {formattedDisplayDate()}
            </span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="w-4 h-4 opacity-0 absolute cursor-pointer"
              title="Select custom date"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="ml-1 text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Today
          </button>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentTime || '--:--:--'}</span>
          </div>

          {/* Focus Timer Trigger */}
          <button
            onClick={onToggleTimer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isTimerActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isTimerActive ? 'Active Focus' : 'Focus Mode'}</span>
          </button>

          {/* Copy Markdown Log */}
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Copy Day Summary to Clipboard"
          >
            {copied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Export Log</span>
              </>
            )}
          </button>

          {/* Add Time Block Button */}
          <button
            onClick={onOpenNewBlockModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition transform active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Time</span>
          </button>
        </div>

      </div>
    </header>
  );
};

