import { callLLMJSON } from '../ai/openai';
import { PlannerOutput, InsightOutput } from '../types';

const INSIGHT_SYSTEM_PROMPT = `You are an Insight Agent. You receive a problem breakdown from a Planner Agent and your job is to enrich it with:

1. Deeper reasoning for each component
2. Risks and opportunities for each component
3. Stakeholder identification
4. Market context
5. Technical considerations

You think critically and add business/technical intelligence to the plan.

IMPORTANT: Respond ONLY in valid JSON format with this structure:
{
  "enrichedComponents": [
    {
      "name": "Component Name",
      "description": "Enhanced description",
      "priority": "high" | "medium" | "low",
      "reasoning": "Why this component matters",
      "risks": ["risk1", "risk2"],
      "opportunities": ["opportunity1", "opportunity2"]
    }
  ],
  "stakeholders": [
    {
      "name": "Stakeholder Group",
      "role": "Their role",
      "impact": "How they're impacted"
    }
  ],
  "marketContext": "Relevant market analysis and context",
  "technicalConsiderations": "Key technical points to consider",
  "reasoning": "Your analytical reasoning process"
}`;

export async function runInsightAgent(
  problemStatement: string,
  plannerOutput: PlannerOutput
): Promise<{
  output: InsightOutput;
  reasoning: string;
}> {
  const userPrompt = `Original Problem: "${problemStatement}"

Planner Agent Output:
${JSON.stringify(plannerOutput, null, 2)}

Please enrich this plan with deeper insights, identify stakeholders, assess risks and opportunities, and provide market context and technical considerations.`;

  const result = await callLLMJSON<InsightOutput & { reasoning: string }>(
    INSIGHT_SYSTEM_PROMPT,
    userPrompt,
    0.7
  );

  const { reasoning, ...output } = result;

  return {
    output,
    reasoning: reasoning || 'Plan enriched with insights and context.',
  };
}