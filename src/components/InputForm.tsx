'use client';

import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface InputFormProps {
  onSubmit: (problemStatement: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  'Build a creator marketplace platform',
  'Design a healthcare appointment booking system',
  'Create an AI-powered customer support platform',
  'Build a real-time collaborative document editor',
];

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-3">
          What problem would you like to solve?
        </h2>
        <p className="text-gray-500">
          Enter your problem statement and our AI agents will create a comprehensive
          execution plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your problem or project idea..."
            className="w-full p-4 pr-14 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 text-gray-800 placeholder:text-gray-400 bg-white shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Try an example:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}