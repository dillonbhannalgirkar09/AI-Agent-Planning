import { NextRequest } from 'next/server';
import { runPlannerAgent } from '@/lib/agents/planner';
import { runInsightAgent } from '@/lib/agents/insight';
import { runExecutionAgent } from '@/lib/agents/execution';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const { problemStatement } = await request.json();

  if (!problemStatement || typeof problemStatement !== 'string') {
    return new Response(JSON.stringify({ error: 'Problem statement is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // ===== Step 1: Planner Agent =====
        send({
          type: 'step',
          agent: 'planner',
          status: 'running',
        });

        const plannerResult = await runPlannerAgent(problemStatement);

        send({
          type: 'step',
          agent: 'planner',
          status: 'completed',
          reasoning: plannerResult.reasoning,
        });

        // ===== Step 2: Insight Agent =====
        send({
          type: 'step',
          agent: 'insight',
          status: 'running',
        });

        const insightResult = await runInsightAgent(
          problemStatement,
          plannerResult.output
        );

        send({
          type: 'step',
          agent: 'insight',
          status: 'completed',
          reasoning: insightResult.reasoning,
        });

        // ===== Step 3: Execution Agent =====
        send({
          type: 'step',
          agent: 'execution',
          status: 'running',
        });

        const executionResult = await runExecutionAgent(
          problemStatement,
          plannerResult.output,
          insightResult.output
        );

        send({
          type: 'step',
          agent: 'execution',
          status: 'completed',
          reasoning: executionResult.reasoning,
        });

        // ===== Final: Send complete report =====
        const report = {
          id: uuidv4(),
          problemStatement,
          sections: executionResult.sections,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        send({
          type: 'complete',
          report,
        });

        controller.close();
      } catch (error: any) {
        send({
          type: 'error',
          message: error.message || 'Failed to process request',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}