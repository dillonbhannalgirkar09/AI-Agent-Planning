import { callLLMJSON } from '../ai/openai';
import { InsightOutput, PlannerOutput, ReportSection } from '../types';
import { v4 as uuidv4 } from 'uuid';

const EXECUTION_SYSTEM_PROMPT = `You are an Execution Agent. You take the enriched plan from the Insight Agent and generate a polished, structured report.

You must generate 4 report sections:

1. **Problem Breakdown** - A comprehensive analysis of the problem, its components, scope, and constraints.
2. **Stakeholders** - Detailed stakeholder analysis with roles, impacts, and engagement strategies.
3. **Solution Approach** - The recommended approach, architecture, technology choices, and methodology.
4. **Action Plan** - A step-by-step execution plan with phases, timelines, milestones, and deliverables.

Each section should be detailed, professional, and written in rich markdown format with:
- Headers and subheaders
- Bullet points and numbered lists
- Bold and italic emphasis
- Tables where appropriate (using markdown table syntax)

IMPORTANT: Respond ONLY in valid JSON format:
{
  "sections": [
    {
      "title": "Problem Breakdown",
      "content": "Detailed markdown content..."
    },
    {
      "title": "Stakeholders",
      "content": "Detailed markdown content..."
    },
    {
      "title": "Solution Approach",
      "content": "Detailed markdown content..."
    },
    {
      "title": "Action Plan",
      "content": "Detailed markdown content..."
    }
  ],
  "reasoning": "Your reasoning for how you structured the report"
}`;

export async function runExecutionAgent(
  problemStatement: string,
  plannerOutput: PlannerOutput,
  insightOutput: InsightOutput
): Promise<{
  sections: ReportSection[];
  reasoning: string;
}> {
  const userPrompt = `Original Problem: "${problemStatement}"

Planner Agent Output:
${JSON.stringify(plannerOutput, null, 2)}

Insight Agent Output:
${JSON.stringify(insightOutput, null, 2)}

Generate a comprehensive, well-structured report with the 4 required sections. Make each section detailed and professional. Use rich markdown formatting including tables, bullet points, bold text, etc.`;

  const result = await callLLMJSON<{
    sections: { title: string; content: string }[];
    reasoning: string;
  }>(EXECUTION_SYSTEM_PROMPT, userPrompt, 0.7);

  const sections: ReportSection[] = result.sections.map((section, index) => ({
    id: uuidv4(),
    title: section.title,
    content: section.content,
    order: index,
    versionHistory: [],
  }));

  return {
    sections,
    reasoning: result.reasoning || 'Structured report generated successfully.',
  };
}