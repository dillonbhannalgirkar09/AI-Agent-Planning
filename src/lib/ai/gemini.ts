import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt 
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

export async function callLLMJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<T> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt 
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  });

  const content = result.response.text() || '{}';
  return JSON.parse(content) as T;
}

export default genAI;

