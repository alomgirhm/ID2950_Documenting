'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, BellRing, Sparkles, BookOpen, Code2, Dumbbell, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FocusTimerProps {
  onClose: () => void;
  activeActivity?: string;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ onClose, activeActivity = 'Deep Focus Session' }) => {
  const [duration, setDuration] = useState<number>(25 * 60); // 25 mins in seconds
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionLabel, setSessionLabel] = useState<string>(activeActivity);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            triggerCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const triggerCompletion = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  };

  const setPreset = (mins: number, label?: string) => {
    setIsRunning(false);
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
    if (label) setSessionLabel(label);
  };

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md mb-6 animate-fadeIn">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">
            Active Focus Sprint
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-4 relative z-10">
        {/* Left: Input & Presets */}
        <div className="w-full md:w-1/2 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Current Focus Objective
            </label>
            <input
              type="text"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="e.g. 09:00 - 10:00 Book reading (Atomic Habits)"
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setPreset(15, 'Book reading session')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 text-xs transition"
            >
              <BookOpen className="w-3 h-3" />
              15m Reading
            </button>
            <button
              onClick={() => setPreset(25, 'Pomodoro focus')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/40 text-xs transition"
            >
              <Sparkles className="w-3 h-3" />
              25m Focus
            </button>
            <button
              onClick={() => setPreset(50, 'Deep Work & Coding')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 text-xs transition"
            >
              <Code2 className="w-3 h-3" />
              50m Deep Work
            </button>
            <button
              onClick={() => setPreset(5, 'Quick Rest & Hydration')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
            >
              <Dumbbell className="w-3 h-3" />
              5m Break
            </button>
          </div>
        </div>

        {/* Right: Big Digital Timer & Controls */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-widest bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent my-1">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 my-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRun}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition transform active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Focus
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

