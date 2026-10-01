# ID2950 — Daily Productivity & Self-Development Operating System

**ID2950** is a modern Next.js application designed to document and audit your entire day, track productivity, and align daily hours with high-leverage self-development projects.

---

## ⚡ Core Features

### 1. ⏱️ 24-Hour Time Logging & Timeline
- **Hourly Logging:** Log blocks like `09:00 - 10:00 --- Book reading`, `10:15 - 12:30 --- Next.js Architecture`, etc.
- **Categorization:** Reading, Coding, Deep Work, Fitness, Mindfulness, Learning, Personal, and Rest.
- **Focus Rating:** 1 to 5 stars for every block to evaluate deep focus vs shallow work.
- **Quick Presets:** 1-click presets for reading sessions, coding sprints, and deep work blocks.
- **Notes & Key Insights:** Capture takeaways, page counts, or learnings directly on each block.

### 2. 🎯 Self-Development Project Management
- Link time blocks directly to active long-term goals (e.g., *"Daily Book Reading & Notes"*, *"ID2950 Application Engineering"*, *"Peak Fitness & Longevity"*).
- Automatic calculation of logged hours vs. target hours.
- Interactive milestone checklists for each project track.
- Create new self-development tracks anytime.

### 3. 📊 Daily Productivity Analytics & Stats
- Real-time calculation of **Productive Focus Hours** vs. total day hours.
- Active habit streak counters (Reading, Coding, Workouts).
- Block completion percentage and day focus quality rating.

### 4. 🧘 Daily Intentions & Evening Reflection
- **Morning Top 3 Priorities:** Checkable high-priority daily objectives.
- **Vital Habits Tracker:** Water intake (8-glass visual tracker), Sleep hours slider, and Energy / Mood selector.
- **Evening Review:** Document "Wins & Breakthroughs", "1% Improvements for Tomorrow", and Overall Day Score (0-100%).

### 5. ⏳ Focus Sprint Pomodoro / Stopwatch
- Built-in timer for 15m Reading Sprints, 25m Pomodoro, 50m Deep Work, and 5m Breaks.
- Audio chime and confetti celebration upon session completion.

### 6. 📋 Export & Backup
- **One-Click Markdown Export:** Copies a formatted daily summary markdown table directly to your clipboard for your Obsidian / Notion / Journal notes.
- **Local Persistence:** All logs, projects, and reflections persist automatically in your browser (`localStorage`).

---

## 🚀 Getting Started

To launch ID2950 in development mode:

```bash
npm run dev
```

Then open your browser and navigate to:
```
http://localhost:3000
```

To create an optimized production build:
```bash
npm run build
npm run start
```
