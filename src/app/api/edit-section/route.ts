import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/ai/openai';

const EDIT_SYSTEM_PROMPT = `You are an AI editor. You will receive a section of a report and an editing instruction. 
Your job is to apply the editing instruction to the content and return the improved version.

Rules:
- Only modify the content based on the instruction
- Maintain markdown formatting
- Keep the overall structure unless told otherwise
- Return ONLY the edited content, no explanations

Common instructions you might receive:
- "Make this more detailed" → Add more depth, examples, specifics
- "Rewrite in a more professional tone" → Use formal business language
- "Shorten this section" → Condense while keeping key points
- "Add more examples" → Include practical examples
- "Make it more actionable" → Add specific steps and metrics`;

export async function POST(request: NextRequest) {
  try {
    const { sectionId, currentContent, instruction, problemStatement, sectionTitle } =
      await request.json();

    if (!currentContent || !instruction) {
      return NextResponse.json(
        { error: 'Content and instruction are required' },
        { status: 400 }
      );
    }

    const userPrompt = `Report Context: This is the "${sectionTitle}" section of a report about: "${problemStatement}"

Current Content:
${currentContent}

Editing Instruction: "${instruction}"

Please apply the editing instruction and return the improved content in markdown format.`;

    const newContent = await callLLM(EDIT_SYSTEM_PROMPT, userPrompt, 0.7);

    return NextResponse.json({
      newContent,
      changes: `Applied: ${instruction}`,
    });
  } catch (error: any) {
    console.error('Edit section error:', error);
    return NextResponse.json(
      { error: 'Failed to edit section', details: error.message },
      { status: 500 }
    );
  }
}