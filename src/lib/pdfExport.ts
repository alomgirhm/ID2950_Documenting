import { jsPDF } from 'jspdf';
import { DayLog, TimeEntry } from '@/types';
import {
  calculateDuration,
  calculateDayTotalDuration,
  calculateMissionDurations,
  calculateDayDetailedStats,
} from '@/lib/timeUtils';

function getFormattedWorkLines(entry: TimeEntry): string {
  if (entry.works && entry.works.length > 0) {
    const valid = entry.works.filter((w) => w.trim().length > 0);
    if (valid.length > 1) {
      return valid.map((w, i) => `${i + 1}. ${w}`).join('\n');
    } else if (valid.length === 1) {
      return valid[0];
    }
  }
  return entry.work || '(No work specified)';
}

/**
 * Renders the Quranic verse from Surah An-Najm 53:39 onto an offscreen canvas
 * with high-DPI Bengali typography and returns a crisp PNG data URL.
 */
function createQuranVerseImage(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const dpr = 3;
    const w = 620;
    const h = 82;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(dpr, dpr);

    // Background card with subtle border
    ctx.fillStyle = '#FBFBFA';
    ctx.strokeStyle = '#E8E6E3';
    ctx.lineWidth = 1;

    // Rounded rectangle
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Amber gold vertical decorative strip on left
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(0, 0, 4.5, h, [r, 0, 0, r]);
    } else {
      ctx.rect(0, 0, 4.5, h);
    }
    ctx.fill();

    // 1. "আল্লাহ বলেন:"
    ctx.fillStyle = '#B45309'; // amber-700
    ctx.font = 'bold 12.5px "Nirmala UI", "Kalpurush", "Vrinda", "Segoe UI", sans-serif';
    ctx.fillText('আল্লাহ বলেন:', 16, 22);

    // 2. Main Verse: “মানুষের জন্য সে-ই আছে, যার জন্য সে চেষ্টা করে।”
    ctx.fillStyle = '#1C1917'; // warm dark text
    ctx.font = 'bold 15px "Nirmala UI", "Kalpurush", "Vrinda", "Segoe UI", sans-serif';
    ctx.fillText('“মানুষের জন্য সে-ই আছে, যার জন্য সে চেষ্টা করে।”', 16, 46);

    // 3. Reference: — সূরা আন-নাজম ৫৩:৩৯
    ctx.fillStyle = '#78716C'; // stone-500
    ctx.font = '11.5px "Nirmala UI", "Kalpurush", "Vrinda", "Segoe UI", sans-serif';
    ctx.fillText('— সূরা আন-নাজম ৫৩:৩৯', 16, 68);

    // English translation on right side
    ctx.textAlign = 'right';
    ctx.fillStyle = '#A8A29E';
    ctx.font = 'italic 10px "Segoe UI", sans-serif';
    ctx.fillText('"And that there is for man only that for which he strives." (53:39)', w - 16, 68);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error generating verse image:', err);
    return null;
  }
}

/**
 * Downloads a complete, beautiful executive PDF report for an entire day:
 * - Executive Productivity Overview with Total Time & Mission Times
 * - "What I Did Today" Work Summary grouped by Mission
 * - Daily Dhikr & Spiritual Remembrance with counts & durations
 * - Quranic verse card
 * - Detailed session cards with full learnings & notes
 * - Mobile Digital Wellbeing app screen time
 */
export function downloadDayPDF(day: DayLog) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const now = new Date();
  const timeStamp = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const stats = calculateDayDetailedStats(day.entries);
  const validDhikr = (day.dhikrList || []).filter(
    (d) => d.name?.trim().length > 0 && d.count && d.count.trim().length > 0
  );
  const validApps = (day.appUsage || []).filter(
    (a) => a.appName?.trim().length > 0
  );

  // 1. Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 25);
  doc.text('ID2950_Documenting', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 120);
  doc.text('DAILY PRODUCTIVITY & LEARNINGS REPORT', margin + 68, y - 1);

  y += 8;

  // 2. Day & Date info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 35);
  doc.text(day.name || 'Untitled Day', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 120, 130);
  doc.text(`Month: ${day.month || 'Active Month'}   |   Exported: ${timeStamp}`, margin, y + 5);

  y += 10;

  // Divider
  doc.setDrawColor(210, 210, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // 3. EXECUTIVE PRODUCTIVITY & MISSION DASHBOARD CARD
  // Compute grouped sessions for "What I Did Today"
  const missionGroups: { mission: string; duration: string; entries: TimeEntry[] }[] = [];
  stats.missions.forEach((m) => {
    const entries = day.entries.filter((e) => e.mission?.trim() === m.mission);
    missionGroups.push({ mission: m.mission, duration: m.duration, entries });
  });
  const untaggedEntries = day.entries.filter((e) => !e.mission?.trim());
  if (untaggedEntries.length > 0) {
    missionGroups.push({
      mission: 'General / Untagged',
      duration: stats.untaggedDuration || 'Untracked',
      entries: untaggedEntries,
    });
  }

  // Pre-calculate height of Executive Summary
  let summaryHeight = 16; // header & KPI row
  if (stats.missions.length > 0 || stats.untaggedMinutes > 0) {
    summaryHeight += 8; // mission pills row
  }
  summaryHeight += 8; // "What I did today" header
  missionGroups.forEach((g) => {
    summaryHeight += 5.5; // group title
    g.entries.forEach((e) => {
      const dur = calculateDuration(e.startTime, e.endTime);
      const wText = getFormattedWorkLines(e).replace(/\n/g, ' ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const splitLines = doc.splitTextToSize(
        `• [${e.startTime || '--:--'} - ${e.endTime || '--:--'}${dur ? ' • ' + dur : ''}] ${wText}`,
        contentWidth - 14
      );
      summaryHeight += splitLines.length * 4.2;
    });
    summaryHeight += 2;
  });
  summaryHeight += 6; // padding

  checkPageBreak(summaryHeight + 6);

  // Background card
  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(218, 224, 234);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, summaryHeight, 2.5, 2.5, 'FD');

  // Amber accent strip on left
  doc.setFillColor(217, 119, 6);
  doc.rect(margin, y + 2, 3, summaryHeight - 4, 'F');

  // Title: EXECUTIVE PRODUCTIVITY & MISSIONS OVERVIEW
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('EXECUTIVE PRODUCTIVITY & MISSIONS OVERVIEW', margin + 7, y + 6);

  // Key KPI Badges row
  let kpiY = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  // Total Time Badge
  const totalText = `Total Time: ${stats.totalDuration || '0m'}`;
  const totalW = doc.getTextWidth(totalText) + 8;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin + 7, kpiY - 4, totalW, 5.8, 1.2, 1.2, 'FD');
  doc.setTextColor(180, 83, 9);
  doc.text(totalText, margin + 11, kpiY);

  // Sessions Badge
  const sessText = `${day.entries.length} Sessions`;
  const sessW = doc.getTextWidth(sessText) + 8;
  const sessX = margin + 7 + totalW + 3;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sessX, kpiY - 4, sessW, 5.8, 1.2, 1.2, 'FD');
  doc.setTextColor(51, 65, 85);
  doc.text(sessText, sessX + 4, kpiY);

  // Dhikr Badge (if present)
  if (validDhikr.length > 0) {
    const dhikrBadge = `${validDhikr.length} Dhikr Recorded`;
    const dhikrW = doc.getTextWidth(dhikrBadge) + 8;
    const dhikrX = sessX + sessW + 3;
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(202, 138, 4);
    doc.roundedRect(dhikrX, kpiY - 4, dhikrW, 5.8, 1.2, 1.2, 'FD');
    doc.setTextColor(161, 98, 7);
    doc.text(dhikrBadge, dhikrX + 4, kpiY);
  }

  // Mobile Apps Badge (if present)
  if (validApps.length > 0) {
    const appBadge = `${validApps.length} Apps Tracked`;
    const appW = doc.getTextWidth(appBadge) + 8;
    const appX = contentWidth + margin - appW - 3;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(165, 180, 252);
    doc.roundedRect(appX, kpiY - 4, appW, 5.8, 1.2, 1.2, 'FD');
    doc.setTextColor(67, 56, 202);
    doc.text(appBadge, appX + 4, kpiY);
  }

  let curY = kpiY + 7;

  // Missions Breakdown line
  if (stats.missions.length > 0 || stats.untaggedMinutes > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('MISSIONS BREAKDOWN:', margin + 7, curY);

    let mLine = '';
    stats.missions.forEach((m, idx) => {
      mLine += `🎯 ${m.mission}: ${m.duration} (${m.sessionCount} sessions • ${m.percentage}%)`;
      if (idx < stats.missions.length - 1) mLine += '   |   ';
    });
    if (stats.untaggedMinutes > 0) {
      if (mLine) mLine += '   |   ';
      mLine += `⚪ Untagged: ${stats.untaggedDuration} (${stats.untaggedCount} sessions)`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const splitMLine = doc.splitTextToSize(mLine, contentWidth - 14);
    doc.text(splitMLine, margin + 7, curY + 4.2);
    curY += splitMLine.length * 4.2 + 4;
  }

  // Work Overview / "What I Did Today"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('WHAT I DID TODAY (WORK OVERVIEW):', margin + 7, curY);
  curY += 4.5;

  missionGroups.forEach((g) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text(`🎯 ${g.mission} (${g.duration}):`, margin + 7, curY);
    curY += 4.2;

    g.entries.forEach((e) => {
      const dur = calculateDuration(e.startTime, e.endTime);
      const wText = getFormattedWorkLines(e).replace(/\n/g, ' ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const bullet = `• [${e.startTime || '--:--'} - ${e.endTime || '--:--'}${dur ? ' • ' + dur : ''}] ${wText}`;
      const splitBullet = doc.splitTextToSize(bullet, contentWidth - 14);
      doc.text(splitBullet, margin + 10, curY);
      curY += splitBullet.length * 4;
    });
    curY += 1.5;
  });

  y += summaryHeight + 6;

  // 4. DAILY DHIKR & SPIRITUAL REMEMBRANCE CARD (Prominently displayed)
  if (validDhikr.length > 0) {
    const dhikrBoxHeight = 11 + validDhikr.length * 5.2;
    checkPageBreak(dhikrBoxHeight + 6);

    doc.setFillColor(254, 252, 246);
    doc.setDrawColor(228, 212, 175);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, dhikrBoxHeight, 2, 2, 'FD');

    // Amber vertical strip on left
    doc.setFillColor(180, 83, 9);
    doc.rect(margin, y + 1.5, 2.5, dhikrBoxHeight - 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(160, 85, 10);
    doc.text('DAILY DHIKR & SPIRITUAL REMEMBRANCE:', margin + 6, y + 6);

    let dY = y + 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 55, 65);
    validDhikr.forEach((d) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${d.name}:`, margin + 6, dY);
      const nameWidth = doc.getTextWidth(`• ${d.name}: `);
      doc.setFont('helvetica', 'normal');
      doc.text(`${d.count}`, margin + 6 + nameWidth, dY);
      dY += 5;
    });

    y += dhikrBoxHeight + 5;
  }

  // 5. Quranic Verse Card
  const verseImg = createQuranVerseImage();
  if (verseImg) {
    const verseHeight = 22;
    checkPageBreak(verseHeight + 6);
    doc.addImage(verseImg, 'PNG', margin, y, contentWidth, verseHeight);
    y += verseHeight + 6;
  }

  // Section Header: DETAILED SESSION LOGS & LEARNING NOTES
  checkPageBreak(14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 35, 45);
  doc.text('DETAILED SESSION LOGS & LEARNING NOTES', margin, y + 2);
  doc.setDrawColor(215, 220, 228);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 5, margin + contentWidth, y + 5);
  y += 9;

  // 6. Loop over all time blocks / sessions
  day.entries.forEach((entry, index) => {
    const duration = calculateDuration(entry.startTime, entry.endTime);
    const timeText = duration
      ? `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} • ${duration} ]`
      : `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} ]`;
    const workText = getFormattedWorkLines(entry);
    const notesText = entry.notes?.trim() || '';

    // Measure Work Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const splitWork = doc.splitTextToSize(workText, contentWidth - 12);
    const workHeight = splitWork.length * 4.8;

    // Measure Notes Text
    let notesHeight = 0;
    let splitNotes: string[] = [];
    if (notesText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      splitNotes = doc.splitTextToSize(notesText, contentWidth - 12);
      notesHeight = 7 + splitNotes.length * 4.2 + 3;
    }

    const totalBlockHeight = 13 + workHeight + notesHeight + 4;
    checkPageBreak(totalBlockHeight + 4);

    // Entry Card Box Background
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(226, 230, 236);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, totalBlockHeight, 2, 2, 'FD');

    // Top Header inside Card: Time badge with duration
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const badgeWidth = Math.max(34, doc.getTextWidth(timeText) + 5);
    doc.setFillColor(30, 35, 45);
    doc.roundedRect(margin + 4, y + 3.5, badgeWidth, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(timeText, margin + 6.5, y + 7.8);

    // Mission badge if present
    if (entry.mission) {
      const missionText = `🎯 Mission: ${entry.mission}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const mWidth = doc.getTextWidth(missionText) + 5;
      const mX = margin + 4 + badgeWidth + 2.5;
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.2);
      doc.roundedRect(mX, y + 3.5, mWidth, 6.5, 1.5, 1.5, 'FD');
      doc.setTextColor(180, 83, 9);
      doc.text(missionText, mX + 2.5, y + 7.8);
    }

    // Session index label on right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 145, 155);
    doc.text(`Session #${index + 1}`, margin + contentWidth - 22, y + 7.8);

    // Work description
    const workStartY = y + 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(25, 25, 30);
    doc.text(splitWork, margin + 5, workStartY);

    let currentBlockY = workStartY + workHeight + 1.5;

    // Notes / Learnings section inside the card
    if (notesText) {
      doc.setDrawColor(230, 233, 238);
      doc.setLineWidth(0.2);
      doc.line(margin + 5, currentBlockY, margin + contentWidth - 5, currentBlockY);
      currentBlockY += 3.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 100, 10);
      doc.text('LEARNINGS & SESSION NOTES:', margin + 5, currentBlockY);

      currentBlockY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(45, 50, 60);
      doc.text(splitNotes, margin + 5, currentBlockY);
    }

    y += totalBlockHeight + 4;
  });

  // 7. Mobile Digital Wellbeing (App Screen Time)
  if (validApps.length > 0) {
    const wellbeingBoxHeight = 12 + validApps.length * 5.5;
    checkPageBreak(wellbeingBoxHeight + 8);
    y += 2;
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(margin, y, contentWidth, wellbeingBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 35, 45);
    doc.text('MOBILE DIGITAL WELLBEING — APP SCREEN TIME:', margin + 4, y + 6);

    let appY = y + 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 65, 75);

    validApps.forEach((app) => {
      doc.text(`• ${app.appName}: ${app.duration || '0m'}`, margin + 5, appY);
      appY += 5;
    });

    y += wellbeingBoxHeight + 4;
  }

  // 8. Numbered Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(
      `ID2950_Documenting Personal Operating System — Generated with self-assigned time & notes. Total Sessions: ${day.entries.length}`,
      margin,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth - 18, pageHeight - 9);
  }

  // File download name sanitization
  const safeName = (day.name || 'Day').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`ID2950_Documenting_${safeName}_Report.pdf`);
}

/**
 * Downloads a PDF for an individual specific session.
 */
export function downloadSingleSessionPDF(day: DayLog, entry: TimeEntry) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 25);
  doc.text('ID2950_Documenting', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 120);
  doc.text('SINGLE SESSION LEARNING RECORD', margin + 68, y - 1);

  y += 8;

  // Day Name & Time
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 35);
  doc.text(day.name || 'Untitled Day', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 130);
  const now = new Date();
  const timeStamp = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Month: ${day.month}   |   Exported: ${timeStamp}`, margin, y);

  y += 8;
  doc.setDrawColor(210, 210, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // Quranic Verse Card
  const verseImg = createQuranVerseImage();
  if (verseImg) {
    const verseHeight = 22;
    doc.addImage(verseImg, 'PNG', margin, y, contentWidth, verseHeight);
    y += verseHeight + 6;
  }

  // Time Box
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 230, 235);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 105, 115);
  doc.text('SCHEDULED SESSION TIME:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(25, 30, 45);
  const duration = calculateDuration(entry.startTime, entry.endTime);
  const missionDisplay = entry.mission ? `   |   🎯 Mission: ${entry.mission}` : '';
  const timeDisplay = duration
    ? `${entry.startTime || '--:--'} — ${entry.endTime || '--:--'}   (Duration: ${duration})${missionDisplay}`
    : `${entry.startTime || '--:--'} — ${entry.endTime || '--:--'}${missionDisplay}`;
  doc.text(timeDisplay, margin + 4, y + 12.5);

  y += 24;

  // Work description (handles multiple numbered items)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(90, 95, 105);
  doc.text('WORK COMPLETED IN THIS SESSION:', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  const workText = getFormattedWorkLines(entry);
  const splitWork = doc.splitTextToSize(workText, contentWidth);
  doc.text(splitWork, margin, y);

  y += splitWork.length * 5.2 + 8;

  // Notes & Learnings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 100, 10);
  doc.text('LEARNINGS, INSIGHTS & NOTES:', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 45, 55);
  const notesText = entry.notes?.trim() || '(No notes logged for this session)';
  const splitNotes = doc.splitTextToSize(notesText, contentWidth);
  doc.text(splitNotes, margin, y);

  y += splitNotes.length * 5 + 16;

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text('ID2950_Documenting Personal Operating System — Verified Session Record', margin, y);

  const safeWork = (entry.work || 'Session').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`ID2950_Documenting_${entry.startTime || 'session'}_${safeWork}.pdf`);
}

/**
 * Downloads a combined, beautifully formatted PDF report for multiple days
 * (e.g. Day 1 - 10, Day 3 - 8, or all selected days).
 */
export function downloadMultiDayPDF(selectedDays: DayLog[], rangeLabel?: string) {
  if (!selectedDays || selectedDays.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const now = new Date();
  const timeStamp = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const allEntries = selectedDays.flatMap((d) => d.entries);
  const multiStats = calculateDayDetailedStats(allEntries);

  // 1. Header Banner on first page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 25);
  doc.text('ID2950_Documenting', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 120);
  doc.text('MULTI-DAY PRODUCTIVITY & LEARNINGS REPORT', margin + 68, y - 1);

  y += 8;

  // 2. Title & Range info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 35);
  const displayRange = rangeLabel || `Combined Report (${selectedDays.length} Days)`;
  doc.text(displayRange, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 130);
  doc.text(
    `Total Days: ${selectedDays.length}   |   Total Sessions: ${allEntries.length}   |   Exported: ${timeStamp}`,
    margin,
    y + 5
  );

  y += 10;

  // Divider
  doc.setDrawColor(210, 210, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // MULTI-DAY OVERALL SUMMARY DASHBOARD
  const multiBoxHeight = 22 + (multiStats.missions.length > 0 ? 8 : 0);
  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(218, 224, 234);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, multiBoxHeight, 2, 2, 'FD');

  doc.setFillColor(217, 119, 6);
  doc.rect(margin, y + 2, 3, multiBoxHeight - 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('COMBINED PERIOD EXECUTIVE SUMMARY', margin + 7, y + 6);

  let mkpiY = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  const mTotalText = `Total Time: ${multiStats.totalDuration || '0m'}`;
  const mTotalW = doc.getTextWidth(mTotalText) + 8;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin + 7, mkpiY - 4, mTotalW, 5.8, 1.2, 1.2, 'FD');
  doc.setTextColor(180, 83, 9);
  doc.text(mTotalText, margin + 11, mkpiY);

  const mSessText = `${allEntries.length} Total Sessions across ${selectedDays.length} Days`;
  const mSessW = doc.getTextWidth(mSessText) + 8;
  const mSessX = margin + 7 + mTotalW + 3;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(mSessX, mkpiY - 4, mSessW, 5.8, 1.2, 1.2, 'FD');
  doc.setTextColor(51, 65, 85);
  doc.text(mSessText, mSessX + 4, mkpiY);

  if (multiStats.missions.length > 0) {
    let mLine = 'Missions Breakdown: ';
    multiStats.missions.forEach((m, idx) => {
      mLine += `🎯 ${m.mission}: ${m.duration} (${m.sessionCount} sessions • ${m.percentage}%)`;
      if (idx < multiStats.missions.length - 1) mLine += '   |   ';
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitMLine = doc.splitTextToSize(mLine, contentWidth - 14);
    doc.text(splitMLine, margin + 7, mkpiY + 7);
  }

  y += multiBoxHeight + 6;

  // Quranic Verse Card on first page
  const verseImg = createQuranVerseImage();
  if (verseImg) {
    const verseHeight = 22;
    checkPageBreak(verseHeight + 6);
    doc.addImage(verseImg, 'PNG', margin, y, contentWidth, verseHeight);
    y += verseHeight + 6;
  }

  // 3. Loop through each day
  selectedDays.forEach((day, dayIndex) => {
    // If not first day, add separator
    if (dayIndex > 0) {
      if (y > pageHeight - margin - 50) {
        doc.addPage();
        y = margin;
      } else {
        y += 4;
        doc.setDrawColor(230, 233, 238);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + contentWidth, y);
        y += 6;
      }
    }

    const dayStats = calculateDayDetailedStats(day.entries);
    const validDhikr = (day.dhikrList || []).filter(
      (d) => d.name?.trim().length > 0 && d.count && d.count.trim().length > 0
    );

    // Day Section Header Banner
    checkPageBreak(25);
    doc.setFillColor(242, 244, 248);
    doc.setDrawColor(218, 222, 230);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 25, 35);
    doc.text(day.name || `Day ${dayIndex + 1}`, margin + 4, y + 5);

    let mBadgeStr = dayStats.missions.map((m) => `🎯 ${m.mission}: ${m.duration}`).join('  •  ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 105, 115);
    doc.text(
      `Total: ${dayStats.totalDuration || '0m'} (${day.entries.length} Sessions)${mBadgeStr ? '   |   ' + mBadgeStr : ''}`,
      margin + 4,
      y + 9.5
    );

    y += 16;

    // Day Entries
    if (day.entries.length === 0) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 160);
      doc.text('(No time blocks logged for this day)', margin + 4, y);
      y += 8;
    } else {
      day.entries.forEach((entry, index) => {
        const duration = calculateDuration(entry.startTime, entry.endTime);
        const timeText = duration
          ? `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} • ${duration} ]`
          : `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} ]`;
        const workText = getFormattedWorkLines(entry);
        const notesText = entry.notes?.trim() || '';

        // Measure Work Text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const splitWork = doc.splitTextToSize(workText, contentWidth - 12);
        const workHeight = splitWork.length * 4.8;

        // Measure Notes Text
        let notesHeight = 0;
        let splitNotes: string[] = [];
        if (notesText) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          splitNotes = doc.splitTextToSize(notesText, contentWidth - 12);
          notesHeight = 7 + splitNotes.length * 4.2 + 3;
        }

        const totalBlockHeight = 13 + workHeight + notesHeight + 4;
        checkPageBreak(totalBlockHeight + 4);

        // Entry Box
        doc.setFillColor(250, 250, 252);
        doc.setDrawColor(226, 230, 236);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentWidth, totalBlockHeight, 2, 2, 'FD');

        // Time badge inside card top with duration
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const badgeWidth = Math.max(34, doc.getTextWidth(timeText) + 5);
        doc.setFillColor(30, 35, 45);
        doc.roundedRect(margin + 4, y + 3.5, badgeWidth, 6.5, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(timeText, margin + 6.5, y + 7.8);

        // Mission badge if present
        if (entry.mission) {
          const missionText = `🎯 Mission: ${entry.mission}`;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          const mWidth = doc.getTextWidth(missionText) + 5;
          const mX = margin + 4 + badgeWidth + 2.5;
          doc.setFillColor(254, 243, 199);
          doc.setDrawColor(217, 119, 6);
          doc.setLineWidth(0.2);
          doc.roundedRect(mX, y + 3.5, mWidth, 6.5, 1.5, 1.5, 'FD');
          doc.setTextColor(180, 83, 9);
          doc.text(missionText, mX + 2.5, y + 7.8);
        }

        // Session index label on right
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 145, 155);
        doc.text(`Session #${index + 1}`, margin + contentWidth - 22, y + 7.8);

        // Work description
        const workStartY = y + 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(25, 25, 30);
        doc.text(splitWork, margin + 5, workStartY);

        let currentBlockY = workStartY + workHeight + 1.5;

        // Notes / Learnings section inside the card
        if (notesText) {
          doc.setDrawColor(230, 233, 238);
          doc.setLineWidth(0.2);
          doc.line(margin + 5, currentBlockY, margin + contentWidth - 5, currentBlockY);
          currentBlockY += 3.5;

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(180, 100, 10);
          doc.text('LEARNINGS & SESSION NOTES:', margin + 5, currentBlockY);

          currentBlockY += 4;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(45, 50, 60);
          doc.text(splitNotes, margin + 5, currentBlockY);
        }

        y += totalBlockHeight + 4;
      });
    }

    // App Usage section for this day
    if (day.appUsage && day.appUsage.length > 0) {
      const validApps = day.appUsage.filter((a) => a.appName.trim().length > 0);
      if (validApps.length > 0) {
        const wellbeingBoxHeight = 12 + validApps.length * 5.5;
        checkPageBreak(wellbeingBoxHeight + 8);
        y += 2;
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(margin, y, contentWidth, wellbeingBoxHeight, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 35, 45);
        doc.text('MOBILE DIGITAL WELLBEING — APP SCREEN TIME:', margin + 4, y + 6);

        let appY = y + 11;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 65, 75);

        validApps.forEach((app) => {
          doc.text(`• ${app.appName}: ${app.duration || '0m'}`, margin + 5, appY);
          appY += 5;
        });

        y += wellbeingBoxHeight + 4;
      }
    }

    // Daily Dhikr & Remembrance section in Multi-Day PDF
    if (validDhikr.length > 0) {
      const dhikrBoxHeight = 12 + validDhikr.length * 5.5;
      checkPageBreak(dhikrBoxHeight + 8);
      y += 2;
      doc.setFillColor(254, 252, 246);
      doc.setDrawColor(228, 212, 175);
      doc.roundedRect(margin, y, contentWidth, dhikrBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(160, 90, 10);
      doc.text('DAILY DHIKR & REMEMBRANCE:', margin + 4, y + 6);

      let dhikrY = y + 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 65, 75);

      validDhikr.forEach((item) => {
        doc.text(`• ${item.name}: ${item.count}`, margin + 5, dhikrY);
        dhikrY += 5;
      });

      y += dhikrBoxHeight + 4;
    }
  });

  // Footer on all pages
  const totalMultiPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalMultiPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(
      `ID2950_Documenting Personal Operating System — Generated with self-assigned time & notes. Total Days: ${selectedDays.length}`,
      margin,
      pageHeight - 9
    );
    doc.text(`Page ${i} of ${totalMultiPages}`, margin + contentWidth - 18, pageHeight - 9);
  }

  const safeTitle = (rangeLabel || 'MultiDay_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`ID2950_Documenting_${safeTitle}.pdf`);
}
