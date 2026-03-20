import { callLLMJSON } from '../ai/openai';
import { PlannerOutput } from '../types';

const PLANNER_SYSTEM_PROMPT = `You are a Planning Agent. Your role is to take a problem statement and break it down into clear, actionable components.

You must analyze the problem and identify:
1. Key components/modules needed
2. The overall scope
3. Constraints that might apply
4. Assumptions being made

You think step by step and provide structured output.

IMPORTANT: Respond ONLY in valid JSON format with this structure:
{
  "components": [
    {
      "name": "Component Name",
      "description": "What this component involves",
      "priority": "high" | "medium" | "low"
    }
  ],
  "scope": "Overall scope description",
  "constraints": ["constraint1", "constraint2"],
  "assumptions": ["assumption1", "assumption2"],
  "reasoning": "Your step-by-step reasoning for this breakdown"
}`;

export async function runPlannerAgent(problemStatement: string): Promise<{
  output: PlannerOutput;
  reasoning: string;
}> {
  const userPrompt = `Problem Statement: "${problemStatement}"

Please analyze this problem and break it down into its core components. Think about what modules, features, or workstreams are needed to solve this problem completely.`;

  const result = await callLLMJSON<PlannerOutput & { reasoning: string }>(
    PLANNER_SYSTEM_PROMPT,
    userPrompt,
    0.7
  );

  const { reasoning, ...output } = result;

  return {
    output,
    reasoning: reasoning || 'Problem decomposed into core components.',
  };
}