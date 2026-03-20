'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  onEdit: (instruction: string) => void;
  isLoading: boolean;
}

const QUICK_ACTIONS = [
  { label: 'More Detailed', instruction: 'Make this more detailed with specific examples and data points' },
  { label: 'Professional Tone', instruction: 'Rewrite in a more professional and formal tone' },
  { label: 'Shorten', instruction: 'Shorten this section while keeping the key points' },
  { label: 'Add Examples', instruction: 'Add practical real-world examples' },
  { label: 'More Actionable', instruction: 'Make it more actionable with specific steps and metrics' },
  { label: 'Simplify', instruction: 'Simplify the language for a non-technical audience' },
];

export default function EditModal({
  isOpen,
  onClose,
  sectionTitle,
  onEdit,
  isLoading,
}: EditModalProps) {
  const [customInstruction, setCustomInstruction] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (instruction: string) => {
    if (instruction.trim()) {
      onEdit(instruction.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Edit Section</h3>
            <p className="text-sm text-gray-500 mt-1">Editing: {sectionTitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSubmit(action.instruction)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-xl text-sm text-gray-700 hover:text-blue-700 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instruction */}
        <div className="p-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Custom Instruction</p>
          <textarea
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="E.g., Add a comparison table, Focus more on technical aspects..."
            className="w-full p-4 border border-gray-300 rounded-xl resize-none h-24 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSubmit(customInstruction)}
            disabled={!customInstruction.trim() || isLoading}
            className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Editing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply Edit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}