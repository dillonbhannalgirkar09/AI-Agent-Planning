import { callLLM as callOpenRouter, callLLMJSON as callOpenRouterJSON } from './openrouter';

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  return callOpenRouter(systemPrompt, userPrompt, temperature);
}

export async function callLLMJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<T> {
  return callOpenRouterJSON<T>(systemPrompt, userPrompt, temperature);
}

// Keeping the default export for compatibility
import openrouter from './openrouter';
export default openrouter;
