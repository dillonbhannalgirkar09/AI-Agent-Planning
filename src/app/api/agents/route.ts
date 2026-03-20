import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { problemStatement } = await request.json();

    if (!problemStatement || typeof problemStatement !== 'string') {
      return NextResponse.json(
        { error: 'Problem statement is required' },
        { status: 400 }
      );
    }

    const result = await runAgentPipeline(problemStatement);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Agent pipeline error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}