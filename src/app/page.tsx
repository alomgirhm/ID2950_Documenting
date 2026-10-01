'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FocusTimer } from '@/components/FocusTimer';
import { DailyStats } from '@/components/DailyStats';
import { TimelineView } from '@/components/TimelineView';
import { ProjectTracker } from '@/components/ProjectTracker';
import { DailyReflection } from '@/components/DailyReflection';
import { TimeBlockModal } from '@/components/TimeBlockModal';
import { DayData, Project, TimeBlock, ActivityCategory, PriorityItem, DailyReflection as DailyReflectionType } from '@/types';
import { 
  getTodayKey, 
  loadDayData, 
  saveDayData, 
  loadProjects, 
  saveProjects, 
  exportDayAsMarkdown 
} from '@/lib/storage';
import { getInitialDayData } from '@/lib/constants';

export default function ID2950App() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Initialize on mount
  useEffect(() => {
    setIsMounted(true);
    const today = getTodayKey();
    setCurrentDate(today);
    const initialProjects = loadProjects();
    setProjects(initialProjects);
    const initialDay = loadDayData(today);
    setDayData(initialDay);
  }, []);

  // Update day data when date changes
  useEffect(() => {
    if (!currentDate) return;
    const data = loadDayData(currentDate);
    setDayData(data);
  }, [currentDate]);

  // Persist dayData whenever it changes
  const updateDayData = (updater: (prev: DayData) => DayData) => {
    setDayData((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveDayData(updated);
      return updated;
    });
  };

  // Toggle Time Block Completion
  const handleToggleComplete = (blockId: string) => {
    updateDayData((prev) => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((b) =>
        b.id === blockId ? { ...b, completed: !b.completed } : b
      ),
    }));
  };

  // Save Time Block (Add or Edit)
  const handleSaveBlock = (block: TimeBlock) => {
    updateDayData((prev) => {
      const exists = prev.timeBlocks.some((b) => b.id === block.id);
      let newBlocks: TimeBlock[];
      if (exists) {
        newBlocks = prev.timeBlocks.map((b) => (b.id === block.id ? block : b));
      } else {
        newBlocks = [...prev.timeBlocks, block];
      }
      return {
        ...prev,
        timeBlocks: newBlocks,
      };
    });
    setEditingBlock(null);
  };

  // Delete Time Block
  const handleDeleteBlock = (blockId: string) => {
    updateDayData((prev) => ({
      ...prev,
      timeBlocks: prev.timeBlocks.filter((b) => b.id !== blockId),
    }));
  };

  // Quick Add Time Block
  const handleQuickAdd = (
    startTime: string,
    endTime: string,
    title: string,
    category: ActivityCategory
  ) => {
    // Attempt auto-match project
    const matchingProj = projects.find((p) => p.category === category);
    const newBlock: TimeBlock = {
      id: `tb-${Date.now()}`,
      startTime,
      endTime,
      title,
      category,
      projectId: matchingProj?.id,
      notes: category === 'Reading' ? 'Daily reading habit logged' : undefined,
      productivityRating: 5,
      completed: true,
    };

    updateDayData((prev) => ({
      ...prev,
      timeBlocks: [...prev.timeBlocks, newBlock],
    }));
  };

  // Projects Management
  const handleAddProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjects(updated);
  };

  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        milestones: p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        ),
      };
    });
    setProjects(updated);
    saveProjects(updated);
  };

  const handleAddMilestone = (projectId: string, title: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        milestones: [...p.milestones, { id: `m-${Date.now()}`, title, completed: false }],
      };
    });
    setProjects(updated);
    saveProjects(updated);
  };

  // Daily Priorities and Reflection Updates
  const handleUpdatePriorities = (priorities: PriorityItem[]) => {
    updateDayData((prev) => ({ ...prev, priorities }));
  };

  const handleUpdateReflection = (reflection: DailyReflectionType) => {
    updateDayData((prev) => ({ ...prev, reflection }));
  };

  // Export as Markdown
  const handleExportMarkdown = () => {
    if (!dayData) return;
    const md = exportDayAsMarkdown(dayData, projects);
    navigator.clipboard.writeText(md).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  };

  if (!isMounted || !dayData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono tracking-widest uppercase">Initializing ID2950 OS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation & Controls */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenNewBlockModal={() => {
          setEditingBlock(null);
          setIsModalOpen(true);
        }}
        onToggleTimer={() => setIsTimerOpen(!isTimerOpen)}
        isTimerActive={isTimerOpen}
        onExportMarkdown={handleExportMarkdown}
        productivityScore={dayData.reflection.overallScore}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        
        {/* Optional Active Focus Sprint Timer */}
        {isTimerOpen && (
          <FocusTimer
            onClose={() => setIsTimerOpen(false)}
            activeActivity="09:00 - 10:00 Book reading"
          />
        )}

        {/* Top Analytics & Metrics */}
        <DailyStats
          timeBlocks={dayData.timeBlocks}
          overallScore={dayData.reflection.overallScore}
        />

        {/* 2-Column Responsive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (7 cols): Daily Timeline & Time Blocking */}
          <div className="lg:col-span-7 space-y-6">
            <TimelineView
              timeBlocks={dayData.timeBlocks}
              projects={projects}
              onToggleComplete={handleToggleComplete}
              onEditBlock={(block) => {
                setEditingBlock(block);
                setIsModalOpen(true);
              }}
              onQuickAdd={handleQuickAdd}
              onOpenModal={() => {
                setEditingBlock(null);
                setIsModalOpen(true);
              }}
            />

            {/* Daily Priorities & Evening Reflection */}
            <DailyReflection
              priorities={dayData.priorities}
              reflection={dayData.reflection}
              onUpdatePriorities={handleUpdatePriorities}
              onUpdateReflection={handleUpdateReflection}
            />
          </div>

          {/* Right Column (5 cols): Self-Development Projects Tracker */}
          <div className="lg:col-span-5 space-y-6">
            <ProjectTracker
              projects={projects}
              allTimeBlocks={dayData.timeBlocks}
              onAddProject={handleAddProject}
              onToggleMilestone={handleToggleMilestone}
              onAddMilestone={handleAddMilestone}
            />
          </div>

        </div>

      </main>

      {/* Modal for adding/editing time blocks */}
      <TimeBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
        initialBlock={editingBlock}
        projects={projects}
      />
    </div>
  );
}

