'use client';

import { AgentStep } from '@/lib/types';
import { CheckCircle2, Loader2, Circle, Brain, Lightbulb, Zap } from 'lucide-react';

interface AgentProgressProps {
  steps: AgentStep[];
}

const agentConfig = {
  planner: {
    label: 'Planner Agent',
    description: 'Breaking problem into components',
    icon: Brain,
    color: 'blue',
  },
  insight: {
    label: 'Insight Agent',
    description: 'Enriching with reasoning & context',
    icon: Lightbulb,
    color: 'amber',
  },
  execution: {
    label: 'Execution Agent',
    description: 'Generating structured report',
    icon: Zap,
    color: 'green',
  },
};

export default function AgentProgress({ steps }: AgentProgressProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
          Agent Pipeline in Progress
        </h3>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const config = agentConfig[step.agent];
            const Icon = config.icon;

            return (
              <div key={step.agent} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : step.status === 'running' ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${
                      step.status === 'completed'
                        ? 'text-green-500'
                        : step.status === 'running'
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    }`} />
                    <span className={`font-semibold ${
                      step.status === 'completed'
                        ? 'text-green-700'
                        : step.status === 'running'
                        ? 'text-blue-700'
                        : 'text-gray-400'
                    }`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{config.description}</p>

                  {step.status === 'completed' && step.reasoning && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-700">{step.reasoning}</p>
                    </div>
                  )}

                  {step.status === 'running' && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 animate-pulse">
                        Processing...
                      </p>
                    </div>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute left-7 mt-8 w-0.5 h-6 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}