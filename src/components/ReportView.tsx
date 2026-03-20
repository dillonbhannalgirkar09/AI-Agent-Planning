'use client';

import { Report } from '@/lib/types';
import ReportSectionComponent from './ReportSection';
import ExportButtons from './ExportButtons';
import { v4 as uuidv4 } from 'uuid';

interface ReportViewProps {
  report: Report;
  onReportUpdate: (report: Report) => void;
}

export default function ReportView({ report, onReportUpdate }: ReportViewProps) {
  const handleSectionUpdate = (
    sectionId: string,
    newContent: string,
    instruction: string
  ) => {
    const updatedSections = report.sections.map((section) => {
      if (section.id === sectionId) {
        const versionHistory = [
          ...(section.versionHistory || []),
          {
            id: uuidv4(),
            content: section.content,
            editInstruction: instruction,
            timestamp: new Date().toISOString(),
          },
        ];

        return {
          ...section,
          content: newContent,
          versionHistory,
        };
      }
      return section;
    });

    onReportUpdate({
      ...report,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Report Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Generated Report</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Problem: &quot;{report.problemStatement}&quot;
          </p>
        </div>
        <ExportButtons report={report} />
      </div>

      {/* Report Content (used for PDF export) */}
      <div id="report-content" className="space-y-6">
        {report.sections.map((section) => (
          <ReportSectionComponent
            key={section.id}
            section={section}
            problemStatement={report.problemStatement}
            onUpdate={handleSectionUpdate}
          />
        ))}
      </div>

      {/* Report Footer */}
      <div className="mt-8 text-center text-sm text-gray-400 pb-8">
        <p>Generated on {new Date(report.createdAt).toLocaleDateString()} by AI Planning Agent</p>
        <p>Last updated: {new Date(report.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}