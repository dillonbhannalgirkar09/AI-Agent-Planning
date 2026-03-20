'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Report } from '@/lib/types';
import { jsPDF } from 'jspdf';

interface ExportButtonsProps {
  report: Report;
}

// ===== PDF Table Drawing with proper text wrapping =====

interface TableConfig {
  pdf: jsPDF;
  startX: number;
  startY: number;
  tableWidth: number;
  headers: string[];
  rows: string[][];
}

function drawTable(config: TableConfig): number {
  const { pdf, startX, startY, tableWidth, headers, rows } = config;
  const colCount = headers.length;
  const padding = 4;
  const fontSize = 8;
  const headerFontSize = 8;

  // Calculate column widths proportionally based on content
  const colWidths = calculateColumnWidths(
    pdf,
    headers,
    rows,
    tableWidth,
    fontSize
  );

  let currentY = startY;

  // ---- Draw Header Row ----
  pdf.setFontSize(headerFontSize);
  pdf.setFont('helvetica', 'bold');

  // Calculate header row height
  let headerHeight = 0;
  const headerWrapped: string[][] = [];
  headers.forEach((header, i) => {
    const maxWidth = colWidths[i] - padding * 2;
    const lines = pdf.splitTextToSize(header, maxWidth);
    headerWrapped.push(lines);
    const h = lines.length * (headerFontSize * 0.4) + padding * 2;
    if (h > headerHeight) headerHeight = h;
  });
  headerHeight = Math.max(headerHeight, 10);

  // Check page break
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (currentY + headerHeight > pageHeight - 20) {
    pdf.addPage();
    currentY = 20;
  }

  // Draw header background
  pdf.setFillColor(26, 26, 46);
  pdf.rect(startX, currentY, tableWidth, headerHeight, 'F');

  // Draw header text
  pdf.setTextColor(255, 255, 255);
  let cellX = startX;
  headers.forEach((_, i) => {
    const lines = headerWrapped[i];
    const textY = currentY + padding + headerFontSize * 0.35;
    lines.forEach((line, lineIdx) => {
      pdf.text(line, cellX + padding, textY + lineIdx * (headerFontSize * 0.4));
    });
    cellX += colWidths[i];
  });

  // Draw header cell borders
  cellX = startX;
  for (let i = 0; i < colCount; i++) {
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.2);
    if (i > 0) {
      pdf.line(cellX, currentY, cellX, currentY + headerHeight);
    }
    cellX += colWidths[i];
  }

  currentY += headerHeight;

  // ---- Draw Data Rows ----
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(fontSize);

  rows.forEach((row, rowIndex) => {
    // Calculate row height based on wrapped text
    let rowHeight = 0;
    const rowWrapped: string[][] = [];

    row.forEach((cell, i) => {
      const colIdx = Math.min(i, colWidths.length - 1);
      const maxWidth = colWidths[colIdx] - padding * 2;
      const cleanCell = cell.replace(/\*\*/g, '');
      const lines = pdf.splitTextToSize(cleanCell, Math.max(maxWidth, 10));
      rowWrapped.push(lines);
      const h = lines.length * (fontSize * 0.4) + padding * 2;
      if (h > rowHeight) rowHeight = h;
    });
    rowHeight = Math.max(rowHeight, 8);

    // Check page break
    if (currentY + rowHeight > pageHeight - 20) {
      pdf.addPage();
      currentY = 20;

      // Redraw header on new page
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(headerFontSize);
      pdf.setFillColor(26, 26, 46);
      pdf.rect(startX, currentY, tableWidth, headerHeight, 'F');
      pdf.setTextColor(255, 255, 255);

      let hx = startX;
      headers.forEach((_, i) => {
        const lines = headerWrapped[i];
        const textY = currentY + padding + headerFontSize * 0.35;
        lines.forEach((line, lineIdx) => {
          pdf.text(
            line,
            hx + padding,
            textY + lineIdx * (headerFontSize * 0.4)
          );
        });
        hx += colWidths[i];
      });
      currentY += headerHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize);
    }

    // Row background (alternating)
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.rect(startX, currentY, tableWidth, rowHeight, 'F');

    // Row border
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.2);
    pdf.rect(startX, currentY, tableWidth, rowHeight, 'S');

    // Cell text and vertical borders
    pdf.setTextColor(55, 65, 81);
    cellX = startX;

    row.forEach((_, i) => {
      const colIdx = Math.min(i, colWidths.length - 1);

      // Vertical cell border
      if (i > 0) {
        pdf.setDrawColor(209, 213, 219);
        pdf.line(cellX, currentY, cellX, currentY + rowHeight);
      }

      // Draw text
      const lines = rowWrapped[i] || [''];
      const textY = currentY + padding + fontSize * 0.3;
      lines.forEach((line, lineIdx) => {
        pdf.text(
          line,
          cellX + padding,
          textY + lineIdx * (fontSize * 0.4)
        );
      });

      cellX += colWidths[colIdx];
    });

    currentY += rowHeight;
  });

  return currentY;
}

function calculateColumnWidths(
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  totalWidth: number,
  fontSize: number
): number[] {
  pdf.setFontSize(fontSize);
  const colCount = headers.length;
  const minColWidth = 25;

  // Measure max content width for each column
  const maxContentWidths: number[] = headers.map(
    (h) => pdf.getTextWidth(h) + 10
  );

  rows.forEach((row) => {
    row.forEach((cell, i) => {
      if (i < colCount) {
        const clean = cell.replace(/\*\*/g, '');
        const w = pdf.getTextWidth(clean) + 10;
        if (w > maxContentWidths[i]) {
          maxContentWidths[i] = w;
        }
      }
    });
  });

  // Calculate proportional widths
  const totalContent = maxContentWidths.reduce((a, b) => a + b, 0);

  let widths: number[];
  if (totalContent <= totalWidth) {
    // Content fits — distribute proportionally with minimum
    widths = maxContentWidths.map((w) =>
      Math.max((w / totalContent) * totalWidth, minColWidth)
    );
  } else {
    // Content too wide — distribute proportionally
    widths = maxContentWidths.map((w) =>
      Math.max((w / totalContent) * totalWidth, minColWidth)
    );
  }

  // Normalize to exactly totalWidth
  const sum = widths.reduce((a, b) => a + b, 0);
  widths = widths.map((w) => (w / sum) * totalWidth);

  return widths;
}

// ===== Main PDF Generator =====

function generatePDF(report: Report) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // ---- Title ----
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(26, 26, 46);
  pdf.text('AI Planning Report', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ---- Problem Statement ----
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  const problemText = `Problem: "${report.problemStatement}"`;
  const problemLines = pdf.splitTextToSize(problemText, contentWidth);
  pdf.text(problemLines, pageWidth / 2, y, { align: 'center' });
  y += problemLines.length * 5 + 5;

  // ---- Divider ----
  pdf.setDrawColor(26, 26, 46);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 15;

  // ---- Sections ----
  report.sections.forEach((section, sectionIndex) => {
    checkPageBreak(25);

    // Section title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(26, 26, 46);
    pdf.text(section.title, margin, y);
    y += 3;

    // Blue underline
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.8);
    const titleWidth = pdf.getTextWidth(section.title);
    pdf.line(margin, y, margin + titleWidth, y);
    y += 10;

    // Parse content
    const lines = section.content.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        y += 3;
        i++;
        continue;
      }

      // Skip # headings (already have section title)
      if (/^#\s+/.test(trimmed) && !trimmed.startsWith('## ')) {
        i++;
        continue;
      }

      // Table detection
      if (trimmed.startsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        // Parse table
        if (tableLines.length >= 2) {
          const parseLine = (l: string) =>
            l
              .split('|')
              .map((c) => c.trim())
              .filter((c) => c !== '');

          const headers = parseLine(tableLines[0]);
          const isSep = tableLines[1].match(/^\|[\s\-:|]+\|$/);

          if (isSep && headers.length > 0) {
            const dataRows: string[][] = [];
            for (let j = 2; j < tableLines.length; j++) {
              const cells = parseLine(tableLines[j]);
              while (cells.length < headers.length) cells.push('');
              dataRows.push(cells.slice(0, headers.length));
            }

            checkPageBreak(20);

            y = drawTable({
              pdf,
              startX: margin,
              startY: y,
              tableWidth: contentWidth,
              headers,
              rows: dataRows,
            });

            y += 8;
          }
        }
        continue;
      }

      checkPageBreak(8);

      // ### Subheading
      if (trimmed.startsWith('### ')) {
        y += 3;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(45, 55, 72);
        const text = trimmed.replace('### ', '');
        const wrapped = pdf.splitTextToSize(text, contentWidth);
        pdf.text(wrapped, margin, y);
        y += wrapped.length * 5 + 3;
        i++;
        continue;
      }

      // ## Subheading
      if (trimmed.startsWith('## ')) {
        y += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(45, 55, 72);
        const text = trimmed.replace('## ', '');
        const wrapped = pdf.splitTextToSize(text, contentWidth);
        pdf.text(wrapped, margin, y);
        y += wrapped.length * 6 + 3;
        i++;
        continue;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed
          .replace(/^[-*]\s/, '')
          .replace(/\*\*/g, '');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);

        // Bullet dot
        pdf.setFillColor(59, 130, 246);
        pdf.circle(margin + 3, y - 1, 1, 'F');

        const wrapped = pdf.splitTextToSize(text, contentWidth - 10);
        checkPageBreak(wrapped.length * 4.5);
        pdf.text(wrapped, margin + 8, y);
        y += wrapped.length * 4.5 + 2;
        i++;
        continue;
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          const num = match[1];
          const text = match[2].replace(/\*\*/g, '');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(59, 130, 246);
          pdf.text(`${num}.`, margin + 2, y);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81);
          const wrapped = pdf.splitTextToSize(text, contentWidth - 12);
          checkPageBreak(wrapped.length * 4.5);
          pdf.text(wrapped, margin + 10, y);
          y += wrapped.length * 4.5 + 2;
        }
        i++;
        continue;
      }

      // Regular paragraph
      const cleanText = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
      const wrapped = pdf.splitTextToSize(cleanText, contentWidth);
      checkPageBreak(wrapped.length * 4.5);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 4.5 + 2;
      i++;
    }

    // Section spacing
    y += 10;

    // Section divider
    if (sectionIndex < report.sections.length - 1) {
      checkPageBreak(10);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  });

  // ---- Footer ----
  checkPageBreak(20);
  y += 10;
  pdf.setDrawColor(204, 204, 204);
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  const footer = `Generated on ${new Date().toLocaleDateString()} by AI Planning Agent`;
  pdf.text(footer, pageWidth / 2, y, { align: 'center' });

  pdf.save('ai-planning-report.pdf');
}

// ===== Component =====

export default function ExportButtonsClient({ report }: ExportButtonsProps) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const response = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: report.problemStatement,
          sections: report.sections.map((s) => ({
            title: s.title,
            content: s.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to export DOCX');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-planning-report.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DOCX export error:', error);
      alert('Failed to export DOCX');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      generatePDF(report);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExportDocx}
        disabled={isExportingDocx}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm"
      >
        {isExportingDocx ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Export DOCX
      </button>
      <button
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
      >
        {isExportingPdf ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export PDF
      </button>
    </div>
  );
}