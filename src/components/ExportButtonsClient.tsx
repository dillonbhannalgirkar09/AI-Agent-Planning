'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Report } from '@/lib/types';
import { jsPDF } from 'jspdf';

interface ExportButtonsProps {
  report: Report;
}

// ===== PDF Generator using pure jsPDF (no html2canvas) =====

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
  pdf.setTextColor(26, 26, 46); // #1a1a2e
  const title = 'AI Planning Report';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, y);
  y += 12;

  // ---- Problem Statement ----
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  const problemLines = pdf.splitTextToSize(
    `Problem: "${report.problemStatement}"`,
    contentWidth
  );
  const problemWidth = pdf.getTextWidth(problemLines[0]);
  pdf.text(problemLines, (pageWidth - problemWidth) / 2, y);
  y += problemLines.length * 5 + 5;

  // ---- Divider ----
  pdf.setDrawColor(26, 26, 46);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 15;

  // ---- Sections ----
  report.sections.forEach((section, sectionIndex) => {
    checkPageBreak(30);

    // Section title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(26, 26, 46);
    pdf.text(section.title, margin, y);
    y += 3;

    // Section title underline
    pdf.setDrawColor(59, 130, 246); // blue
    pdf.setLineWidth(0.8);
    pdf.line(margin, y, margin + pdf.getTextWidth(section.title), y);
    y += 10;

    // Parse and render content
    const lines = section.content.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 3;
        return;
      }

      checkPageBreak(10);

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
      }
      // ## Subheading
      else if (trimmed.startsWith('## ')) {
        y += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(45, 55, 72);
        const text = trimmed.replace('## ', '');
        const wrapped = pdf.splitTextToSize(text, contentWidth);
        pdf.text(wrapped, margin, y);
        y += wrapped.length * 6 + 3;
      }
      // Bullet points
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.replace(/^[-*]\s/, '');
        const cleanText = text.replace(/\*\*/g, ''); // strip bold markers
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);

        // Bullet dot
        pdf.setFillColor(59, 130, 246);
        pdf.circle(margin + 3, y - 1, 1, 'F');

        const wrapped = pdf.splitTextToSize(cleanText, contentWidth - 10);
        pdf.text(wrapped, margin + 8, y);
        y += wrapped.length * 4.5 + 2;
      }
      // Numbered list
      else if (/^\d+\.\s/.test(trimmed)) {
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
          pdf.text(wrapped, margin + 10, y);
          y += wrapped.length * 4.5 + 2;
        }
      }
      // Table row (markdown table)
      else if (trimmed.startsWith('|')) {
        // Skip separator rows like |---|---|
        if (trimmed.match(/^\|[\s-|]+\|$/)) return;

        const cells = trimmed
          .split('|')
          .filter((c) => c.trim() !== '')
          .map((c) => c.trim().replace(/\*\*/g, ''));

        if (cells.length > 0) {
          const isHeader = lines[lines.indexOf(line) + 1]?.trim().match(/^\|[\s-|]+\|$/);
          const cellWidth = contentWidth / cells.length;

          cells.forEach((cell, i) => {
            const x = margin + i * cellWidth;

            // Cell background for headers
            if (isHeader) {
              pdf.setFillColor(243, 244, 246);
              pdf.rect(x, y - 4, cellWidth, 7, 'F');
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFont('helvetica', 'normal');
            }

            // Cell border
            pdf.setDrawColor(209, 213, 219);
            pdf.setLineWidth(0.2);
            pdf.rect(x, y - 4, cellWidth, 7);

            pdf.setFontSize(8);
            pdf.setTextColor(55, 65, 81);
            const truncated = cell.length > 40 ? cell.substring(0, 37) + '...' : cell;
            pdf.text(truncated, x + 2, y);
          });
          y += 7;
        }
      }
      // Regular paragraph
      else {
        const cleanText = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        const wrapped = pdf.splitTextToSize(cleanText, contentWidth);
        checkPageBreak(wrapped.length * 4.5);
        pdf.text(wrapped, margin, y);
        y += wrapped.length * 4.5 + 2;
      }
    });

    // Space between sections
    y += 10;

    // Section divider (except last)
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
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, y);

  // Save
  pdf.save('ai-planning-report.pdf');
}

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