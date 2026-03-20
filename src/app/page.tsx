'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import InputForm from '@/components/InputForm';
import AgentProgress from '@/components/AgentProgress';
import ReportView from '@/components/ReportView';
import { Report, AgentStep } from '@/lib/types';
import { ArrowLeft, ChevronDown, ChevronUp, Brain } from 'lucide-react';

type AppState = 'input' | 'processing' | 'report';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input');
  const [report, setReport] = useState<Report | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentSteps, setShowAgentSteps] = useState(false);

  // Auto-save report to localStorage
  useEffect(() => {
    if (report) {
      localStorage.setItem('ai-planning-report', JSON.stringify(report));
      localStorage.setItem('ai-planning-steps', JSON.stringify(agentSteps));
    }
  }, [report, agentSteps]);

  // Load saved report on mount
  useEffect(() => {
    const savedReport = localStorage.getItem('ai-planning-report');
    const savedSteps = localStorage.getItem('ai-planning-steps');
    if (savedReport) {
      try {
        setReport(JSON.parse(savedReport));
        if (savedSteps) setAgentSteps(JSON.parse(savedSteps));
        setAppState('report');
      } catch (e) {
        console.error('Failed to load saved report');
      }
    }
  }, []);

  const handleSubmit = async (problemStatement: string) => {
    setIsLoading(true);
    setAppState('processing');

    // Initialize steps
    const initialSteps: AgentStep[] = [
      { agent: 'planner', status: 'pending' },
      { agent: 'insight', status: 'pending' },
      { agent: 'execution', status: 'pending' },
    ];
    setAgentSteps(initialSteps);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemStatement }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          const dataLine = message
            .split('\n')
            .find((line) => line.startsWith('data: '));
          if (!dataLine) continue;

          const jsonStr = dataLine.replace('data: ', '');
          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'step') {
              setAgentSteps((prev) => {
                const updated = [...prev];
                const agentIndex = updated.findIndex(
                  (s) => s.agent === data.agent
                );
                if (agentIndex !== -1) {
                  updated[agentIndex] = {
                    ...updated[agentIndex],
                    status: data.status,
                    reasoning: data.reasoning || updated[agentIndex].reasoning,
                    ...(data.status === 'running'
                      ? { startedAt: new Date().toISOString() }
                      : {}),
                    ...(data.status === 'completed'
                      ? { completedAt: new Date().toISOString() }
                      : {}),
                  };
                }
                return updated;
              });
            }

            if (data.type === 'complete') {
              setReport(data.report);
              // Small delay so user can see the last step complete
              await new Promise((resolve) => setTimeout(resolve, 800));
              setAppState('report');
            }

            if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            // Skip malformed JSON
            if (
              parseError instanceof Error &&
              parseError.message !== 'Failed to generate report'
            ) {
              console.warn('Parse error:', parseError);
            } else {
              throw parseError;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate report. Please try again.');
      setAppState('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewReport = () => {
    setReport(null);
    setAgentSteps([]);
    setAppState('input');
    setShowAgentSteps(false);
    localStorage.removeItem('ai-planning-report');
    localStorage.removeItem('ai-planning-steps');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState === 'input' && (
          <div className="mt-16">
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {appState === 'processing' && (
          <div className="mt-16">
            <AgentProgress steps={agentSteps} />
          </div>
        )}

        {appState === 'report' && report && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleNewReport}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                New Report
              </button>
            </div>

            {/* Agent Reasoning Steps - Collapsible */}
            {agentSteps.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowAgentSteps(!showAgentSteps)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-700">
                    Agent Reasoning Steps
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    (3 agents executed)
                  </span>
                  <div className="ml-auto">
                    {showAgentSteps ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {showAgentSteps && (
                  <div className="mt-2">
                    <AgentProgress steps={agentSteps} />
                  </div>
                )}
              </div>
            )}

            <ReportView
              report={report}
              onReportUpdate={(updatedReport) => setReport(updatedReport)}
            />
          </div>
        )}
      </main>
    </div>
  );
} 