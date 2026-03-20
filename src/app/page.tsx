'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import InputForm from '@/components/InputForm';
import AgentProgress from '@/components/AgentProgress';
import ReportView from '@/components/ReportView';
import { Report, AgentStep, AgentPipelineResult } from '@/lib/types';
import { ArrowLeft, ChevronDown, ChevronUp, Brain } from 'lucide-react';

type AppState = 'input' | 'processing' | 'report';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input');
  const [report, setReport] = useState<Report | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentSteps, setShowAgentSteps] = useState(false);

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

  // Update handleNewReport to clear localStorage
  const handleNewReport = () => {
    setReport(null);
    setAgentSteps([]);
    setAppState('input');
    setShowAgentSteps(false);
    localStorage.removeItem('ai-planning-report');
    localStorage.removeItem('ai-planning-steps');
  };


  const handleSubmit = async (problemStatement: string) => {
    setIsLoading(true);
    setAppState('processing');

    const initialSteps: AgentStep[] = [
      { agent: 'planner', status: 'running' },
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

      const result: AgentPipelineResult = await response.json();

      // Animate through the steps
      for (let i = 0; i < result.steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setAgentSteps((prev) => {
          const updated = [...prev];
          updated[i] = result.steps[i];
          if (i + 1 < updated.length) {
            updated[i + 1] = { ...updated[i + 1], status: 'running' };
          }
          return updated;
        });
      }

      setAgentSteps(result.steps);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReport(result.report);
      setAppState('report');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate report. Please try again.');
      setAppState('input');
    } finally {
      setIsLoading(false);
    }
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