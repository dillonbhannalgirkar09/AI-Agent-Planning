'use client';

import { useState } from 'react';
import { ReportSection as ReportSectionType } from '@/lib/types';
import { Edit3, History, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EditModal from './EditModal';

interface ReportSectionProps {
  section: ReportSectionType;
  problemStatement: string;
  onUpdate: (sectionId: string, newContent: string, instruction: string) => void;
}

const sectionIcons: Record<string, string> = {
  'Problem Breakdown': '🔍',
  'Stakeholders': '👥',
  'Solution Approach': '💡',
  'Action Plan': '📋',
};

export default function ReportSectionComponent({
  section,
  problemStatement,
  onUpdate,
}: ReportSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleEdit = async (instruction: string) => {
    setIsEditing(true);
    try {
      const response = await fetch('/api/edit-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          currentContent: section.content,
          instruction,
          problemStatement,
          sectionTitle: section.title,
        }),
      });

      if (!response.ok) throw new Error('Failed to edit section');

      const data = await response.json();
      onUpdate(section.id, data.newContent, instruction);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to edit section. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        {/* Section Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sectionIcons[section.title] || '📄'}</span>
            <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {section.versionHistory && section.versionHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span>{section.versionHistory.length} edits</span>
                {showHistory ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              AI Edit
            </button>
          </div>
        </div>

        {/* Version History */}
        {showHistory && section.versionHistory && section.versionHistory.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">Edit History</p>
            <div className="space-y-2">
              {section.versionHistory.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-center gap-2 text-xs text-amber-700"
                >
                  <span className="bg-amber-200 px-2 py-0.5 rounded">v{index + 1}</span>
                  <span>{version.editInstruction}</span>
                  <span className="text-amber-500">
                    {new Date(version.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content - WITH remarkGfm for tables */}
        <div className="p-6 markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-100">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-4 py-2 text-gray-600">
                  {children}
                </td>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3 pb-2 border-b border-gray-200">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside ml-6 space-y-1 my-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside ml-6 space-y-1 my-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-600 leading-relaxed">{children}</li>
              ),
              p: ({ children }) => (
                <p className="text-gray-600 leading-relaxed mb-3">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-gray-800">{children}</strong>
              ),
            }}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        sectionTitle={section.title}
        onEdit={handleEdit}
        isLoading={isEditing}
      />
    </>
  );
}