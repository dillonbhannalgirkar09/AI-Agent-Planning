import { runPlannerAgent } from './planner';
import { runInsightAgent } from './insight';
import { runExecutionAgent } from './execution';
import { AgentStep, AgentPipelineResult, Report } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function runAgentPipeline(
  problemStatement: string,
  onStepUpdate?: (steps: AgentStep[]) => void
): Promise<AgentPipelineResult> {
  const steps: AgentStep[] = [
    { agent: 'planner', status: 'pending' },
    { agent: 'insight', status: 'pending' },
    { agent: 'execution', status: 'pending' },
  ];

  // Step 1: Planner Agent
  steps[0] = { ...steps[0], status: 'running', startedAt: new Date().toISOString() };
  onStepUpdate?.(steps);

  const plannerResult = await runPlannerAgent(problemStatement);
  steps[0] = {
    ...steps[0],
    status: 'completed',
    output: plannerResult.output,
    reasoning: plannerResult.reasoning,
    completedAt: new Date().toISOString(),
  };
  onStepUpdate?.(steps);

  // Step 2: Insight Agent
  steps[1] = { ...steps[1], status: 'running', startedAt: new Date().toISOString() };
  onStepUpdate?.(steps);

  const insightResult = await runInsightAgent(problemStatement, plannerResult.output);
  steps[1] = {
    ...steps[1],
    status: 'completed',
    output: insightResult.output,
    reasoning: insightResult.reasoning,
    completedAt: new Date().toISOString(),
  };
  onStepUpdate?.(steps);

  // Step 3: Execution Agent
  steps[2] = { ...steps[2], status: 'running', startedAt: new Date().toISOString() };
  onStepUpdate?.(steps);

  const executionResult = await runExecutionAgent(
    problemStatement,
    plannerResult.output,
    insightResult.output
  );
  steps[2] = {
    ...steps[2],
    status: 'completed',
    output: executionResult.sections,
    reasoning: executionResult.reasoning,
    completedAt: new Date().toISOString(),
  };
  onStepUpdate?.(steps);

  const report: Report = {
    id: uuidv4(),
    problemStatement,
    sections: executionResult.sections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { steps, report };
}