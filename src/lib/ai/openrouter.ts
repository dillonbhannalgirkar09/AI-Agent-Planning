import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/dillonbhannalgirkar09/AI-Agent-Planning', // Optional, for OpenRouter rankings
    'X-Title': 'AI Agent Planning', // Optional
  },
});

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: 'google/gemini-2.0-flash-001',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  });

  return response.choices[0].message.content || '';
}

export async function callLLMJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<T> {
  const response = await openrouter.chat.completions.create({
    model: 'google/gemini-2.0-flash-001',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content) as T;
}

export default openrouter;
