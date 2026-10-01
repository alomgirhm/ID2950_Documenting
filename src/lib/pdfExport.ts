import { jsPDF } from 'jspdf';
import { DayLog, TimeEntry } from '@/types';

/**
 * Downloads a clean, beautifully formatted PDF report for an entire day,
 * including all sessions, time ranges, work completed, and dropable notes/learnings.
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
    }
  };

  // 1. Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 25);
  doc.text('ID2950', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 120);
  doc.text('DAILY PRODUCTIVITY & LEARNINGS REPORT', margin + 26, y - 1);

  y += 8;

  // 2. Day & Date info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 35);
  doc.text(day.name, margin, y);

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
  doc.text(`Month: ${day.month}   |   Exported: ${timeStamp}`, margin, y + 5);

  y += 11;

  // Divider
  doc.setDrawColor(210, 210, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 7;

  // 3. Loop over all time blocks / sessions
  day.entries.forEach((entry, idx) => {
    // Estimate height needed for this entry
    const timeText = `[ ${entry.startTime || '--:--'} - ${entry.endTime || '--:--'} ]`;
    const workText = entry.work || '(No work specified)';
    const notesText = entry.notes?.trim() || '';

    const splitWork = doc.splitTextToSize(workText, contentWidth - 45);
    const workHeight = splitWork.length * 5;

    let notesHeight = 0;
    let splitNotes: string[] = [];
    if (notesText) {
      doc.setFontSize(9);
      splitNotes = doc.splitTextToSize(notesText, contentWidth - 10);
      notesHeight = 8 + splitNotes.length * 4.5 + 4;
    }

    const totalBlockHeight = Math.max(16, workHeight + 10) + notesHeight + 6;
    checkPageBreak(totalBlockHeight);

    // Entry Box Background
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(225, 230, 235);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, totalBlockHeight - 4, 2, 2, 'FD');

    // Entry Header: Time badge
    doc.setFillColor(30, 35, 45);
    doc.roundedRect(margin + 3, y + 3, 34, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(timeText, margin + 4.5, y + 7.5);

    // Work Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 30);
    doc.text(splitWork, margin + 41, y + 7.5);

    let currentBlockY = y + Math.max(12, workHeight + 7);

    // Notes / Learnings section inside the card
    if (notesText) {
      doc.setDrawColor(230, 232, 238);
      doc.setLineWidth(0.2);
      doc.line(margin + 4, currentBlockY, margin + contentWidth - 4, currentBlockY);
      currentBlockY += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 100, 10); // subtle amber
      doc.text('LEARNINGS & SESSION NOTES:', margin + 4, currentBlockY);

      currentBlockY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(45, 50, 60);
      doc.text(splitNotes, margin + 4, currentBlockY);
    }

    y += totalBlockHeight;
  });

  // Footer on last page
  checkPageBreak(15);
  y = Math.min(y + 6, pageHeight - 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text(
    `ID2950 Personal Operating System — Generated with self-assigned time & notes. Total Sessions: ${day.entries.length}`,
    margin,
    y
  );

  // File download name sanitization
  const safeName = day.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`ID2950_${safeName}_Notes.pdf`);
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
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 25);
  doc.text('ID2950', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 120);
  doc.text('SINGLE SESSION LEARNING RECORD', margin + 26, y - 1);

  y += 8;

  // Day Name & Time
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 35);
  doc.text(day.name, margin, y);

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

  y += 10;

  // Time & Work Box
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 230, 235);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 105, 115);
  doc.text('SCHEDULED TIME:', margin + 4, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(25, 30, 45);
  doc.text(`${entry.startTime || '--:--'} — ${entry.endTime || '--:--'}`, margin + 4, y + 14);

  y += 30;

  // Work description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(90, 95, 105);
  doc.text('WHAT WORK I DID:', margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 25);
  const splitWork = doc.splitTextToSize(entry.work || '(No work specified)', contentWidth);
  doc.text(splitWork, margin, y);

  y += splitWork.length * 6 + 10;

  // Notes & Learnings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 100, 10);
  doc.text('LEARNINGS, INSIGHTS & NOTES:', margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 45, 55);
  const notesText = entry.notes?.trim() || '(No notes logged for this session)';
  const splitNotes = doc.splitTextToSize(notesText, contentWidth);
  doc.text(splitNotes, margin, y);

  y += splitNotes.length * 5.5 + 20;

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 150);
  doc.text('ID2950 Personal Operating System — Verified Session Record', margin, y);

  const safeWork = (entry.work || 'Session').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  doc.save(`ID2950_${entry.startTime || 'session'}_${safeWork}.pdf`);
}
