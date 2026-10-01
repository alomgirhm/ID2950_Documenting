'use client';

import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Target, 
  Award, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Project, Milestone, ActivityCategory, TimeBlock } from '@/types';

interface ProjectTrackerProps {
  projects: Project[];
  allTimeBlocks: TimeBlock[];
  onAddProject: (project: Project) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onAddMilestone: (projectId: string, title: string) => void;
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({
  projects,
  allTimeBlocks,
  onAddProject,
  onToggleMilestone,
  onAddMilestone,
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('Reading');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetHours, setNewTargetHours] = useState(20);
  const [newMilestoneInputs, setNewMilestoneInputs] = useState<Record<string, string>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'proj-1': true,
    'proj-2': true,
    'proj-3': true,
  });

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const proj: Project = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Daily self-development focus initiative',
      targetHours: Number(newTargetHours) || 20,
      color: '#6366f1',
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Define core daily routine', completed: false },
        { id: `m-${Date.now()}-2`, title: 'Log 10 hours of focused execution', completed: false },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddProject(proj);
    setNewTitle('');
    setNewDescription('');
    setIsAddingProject(false);
    setExpandedProjects((prev) => ({ ...prev, [proj.id]: true }));
  };

  // Helper to calculate total hours logged for each project
  const calculateLoggedHours = (projectId: string): number => {
    let totalMinutes = 0;
    allTimeBlocks
      .filter((b) => b.projectId === projectId && b.completed)
      .forEach((b) => {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff > 0) totalMinutes += diff;
      });
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const handleAddMilestoneSubmit = (projectId: string) => {
    const title = newMilestoneInputs[projectId]?.trim();
    if (!title) return;
    onAddMilestone(projectId, title);
    setNewMilestoneInputs((prev) => ({ ...prev, [projectId]: '' }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Self-Development Projects
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect your daily hours to lifelong mastery goals & milestones.
          </p>
        </div>

        <button
          onClick={() => setIsAddingProject(!isAddingProject)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
        >
          {isAddingProject ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAddingProject ? 'Cancel' : 'New Project'}</span>
        </button>
      </div>

      {/* New Project Form */}
      {isAddingProject && (
        <form
          onSubmit={handleCreateProject}
          className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-3 animate-fadeIn"
        >
          <div className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Create Self-Development Track
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Project Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Master High-Leverage Skills"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ActivityCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="Reading">Reading</option>
                <option value="Coding">Coding</option>
                <option value="Deep Work">Deep Work</option>
                <option value="Learning">Learning</option>
                <option value="Fitness">Fitness</option>
                <option value="Mindfulness">Mindfulness</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What is the daily habit or outcome goal?"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Target Hours
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={newTargetHours}
                onChange={(e) => setNewTargetHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              Save Project
            </button>
          </div>
        </form>
      )}

      {/* Projects List */}
      <div className="space-y-4 mt-4">
        {projects.map((project) => {
          const loggedHours = calculateLoggedHours(project.id);
          const percent = Math.min(Math.round((loggedHours / project.targetHours) * 100), 100);
          const isExpanded = !!expandedProjects[project.id];
          const completedMilestones = project.milestones.filter((m) => m.completed).length;

          return (
            <div
              key={project.id}
              className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 hover:border-slate-700/80 transition"
            >
              {/* Top Row: Title + Progress Stats */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                    <h3 className="font-bold text-sm text-white">{project.title}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {project.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{project.description}</p>
                </div>

                <button
                  onClick={() => toggleExpand(project.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Toggle details"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Progress Bar & Hours */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400">
                    Logged: <span className="text-white font-mono font-bold">{loggedHours}h</span> / {project.targetHours}h
                  </span>
                  <span className="text-indigo-400 font-mono font-bold">{percent}%</span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-emerald-400"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Expanded Milestones Checklist */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Milestones ({completedMilestones}/{project.milestones.length})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {project.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => onToggleMilestone(project.id, m.id)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer transition text-xs select-none"
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={m.completed ? 'text-slate-400 line-through' : 'text-slate-200'}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Milestone Inline */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add milestone / next chapter..."
                      value={newMilestoneInputs[project.id] || ''}
                      onChange={(e) =>
                        setNewMilestoneInputs((prev) => ({
                          ...prev,
                          [project.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMilestoneSubmit(project.id);
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleAddMilestoneSubmit(project.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

