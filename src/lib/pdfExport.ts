import { jsPDF } from 'jspdf';
import { DayLog, TimeEntry } from '@/types';
import { calculateDuration, calculateDayTotalDuration } from '@/lib/timeUtils';

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
 * Downloads a clean, beautifully formatted PDF report for an entire day,
 * including all sessions, time ranges, multiple numbered works, and dropable notes/learnings.
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
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 35);
  doc.text(day.name || 'Untitled Day', margin, y);

  // Month tag & timestamp
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
  const totalDayTime = calculateDayTotalDuration(day.entries);
  doc.text(
    `Month: ${day.month}   |   Exported: ${timeStamp}${totalDayTime ? `   |   Total Time: ${totalDayTime}` : ''}`,
    margin,
    y + 5
  );

  y += 11;

  // Divider
  doc.setDrawColor(210, 210, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // Quranic Verse Card
  const verseImg = createQuranVerseImage();
  if (verseImg) {
    const verseHeight = 22;
    checkPageBreak(verseHeight + 6);
    doc.addImage(verseImg, 'PNG', margin, y, contentWidth, verseHeight);
    y += verseHeight + 6;
  }

  // 3. Loop over all time blocks / sessions
  day.entries.forEach((entry, index) => {
    const duration = calculateDuration(entry.startTime, entry.endTime);
    const timeText = duration
      ? `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} • ${duration} ]`
      : `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} ]`;
    const workText = getFormattedWorkLines(entry);
    const notesText = entry.notes?.trim() || '';

    // Measure Work Text accurately with bold 9.5pt font across full card width
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const splitWork = doc.splitTextToSize(workText, contentWidth - 12);
    const workHeight = splitWork.length * 4.8;

    // Measure Notes Text accurately with normal 8.5pt font
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

    // 1. Entry Card Box Background
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(226, 230, 236);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, totalBlockHeight, 2, 2, 'FD');

    // 2. Top Header inside Card: Time badge with duration
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const badgeWidth = Math.max(34, doc.getTextWidth(timeText) + 5);
    doc.setFillColor(30, 35, 45);
    doc.roundedRect(margin + 4, y + 3.5, badgeWidth, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(timeText, margin + 6.5, y + 7.8);

    // Session index label on the right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 145, 155);
    doc.text(`Session #${index + 1}`, margin + contentWidth - 22, y + 7.8);

    // 3. Work description (Full width, padded on both sides, NEVER overflows)
    const workStartY = y + 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(25, 25, 30);
    doc.text(splitWork, margin + 5, workStartY);

    let currentBlockY = workStartY + workHeight + 1.5;

    // 4. Notes / Learnings section inside the card
    if (notesText) {
      doc.setDrawColor(230, 233, 238);
      doc.setLineWidth(0.2);
      doc.line(margin + 5, currentBlockY, margin + contentWidth - 5, currentBlockY);
      currentBlockY += 3.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 100, 10); // warm amber
      doc.text('LEARNINGS & SESSION NOTES:', margin + 5, currentBlockY);

      currentBlockY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(45, 50, 60);
      doc.text(splitNotes, margin + 5, currentBlockY);
    }

    y += totalBlockHeight + 4;
  });

  // Digital Wellbeing App Screen Time section in PDF
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

  // Daily Dhikr & Remembrance section in PDF
  if (day.dhikrList && day.dhikrList.length > 0) {
    const validDhikr = day.dhikrList.filter(
      (d) => d.name.trim().length > 0 && d.count && d.count.trim().length > 0
    );
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
  }


  // Footer on last page
  checkPageBreak(15);
  y = Math.min(y + 6, pageHeight - 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text(
    `ID2950_Documenting Personal Operating System — Generated with self-assigned time & notes. Total Sessions: ${day.entries.length}`,
    margin,
    y
  );

  // File download name sanitization
  const safeName = (day.name || 'Day').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`ID2950_Documenting_${safeName}_Notes.pdf`);
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
  const timeDisplay = duration
    ? `${entry.startTime || '--:--'} — ${entry.endTime || '--:--'}   (Duration: ${duration})`
    : `${entry.startTime || '--:--'} — ${entry.endTime || '--:--'}`;
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
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 35);
  const displayRange = rangeLabel || `Combined Report (${selectedDays.length} Days)`;
  doc.text(displayRange, margin, y);

  // Stats banner
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
  const totalSessions = selectedDays.reduce((acc, d) => acc + d.entries.length, 0);
  doc.text(
    `Total Days: ${selectedDays.length}   |   Total Sessions: ${totalSessions}   |   Exported: ${timeStamp}`,
    margin,
    y + 5
  );

  y += 11;

  // Divider
  doc.setDrawColor(210, 210, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

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
    // If not first day, check if space is tight, else add divider
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

    // Day Section Header Banner
    checkPageBreak(25);
    doc.setFillColor(242, 244, 248);
    doc.setDrawColor(218, 222, 230);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 25, 35);
    doc.text(day.name || `Day ${dayIndex + 1}`, margin + 4, y + 6.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 105, 115);
    doc.text(
      `Month: ${day.month}  •  ${day.entries.length} Sessions`,
      margin + contentWidth - 45,
      y + 6.8
    );

    y += 14;

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

        // Measure Work Text accurately with bold 9.5pt font
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const splitWork = doc.splitTextToSize(workText, contentWidth - 12);
        const workHeight = splitWork.length * 4.8;

        // Measure Notes Text accurately with normal 8.5pt font
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

        // Session index label on the right
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 145, 155);
        doc.text(`Session #${index + 1}`, margin + contentWidth - 22, y + 7.8);

        // Work Title (Full width, padded on both sides, NEVER overflows)
        const workStartY = y + 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(25, 25, 30);
        doc.text(splitWork, margin + 5, workStartY);

        let currentBlockY = workStartY + workHeight + 1.5;

        // Notes inside card
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
    if (day.dhikrList && day.dhikrList.length > 0) {
      const validDhikr = day.dhikrList.filter(
        (d) => d.name.trim().length > 0 && d.count && d.count.trim().length > 0
      );
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
    }

    y += 2;
  });

  // Footer on last page
  checkPageBreak(15);
  y = Math.min(y + 6, pageHeight - 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text(
    `ID2950_Documenting Personal Operating System — Multi-Day Report (${selectedDays.length} Days, ${totalSessions} Total Sessions)`,
    margin,
    y
  );

  // Filename
  const safeRange = (rangeLabel || `Days_${selectedDays.length}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`ID2950_Documenting_MultiDay_${safeRange}.pdf`);
}

