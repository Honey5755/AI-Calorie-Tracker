import type { Nutrition } from '@/lib/types';
import { analyzeWithGemini, isGeminiConfigured } from './gemini';
import { mockAnalyze } from './mockAnalyzer';

/**
 * Single source of truth for food recognition. Screens call only this.
 * - Real AI (Gemini) when EXPO_PUBLIC_GEMINI_API_KEY is set.
 * - Graceful mock fallback otherwise, or if a real call fails — the demo never breaks.
 */

export type AnalyzeResult = {
  nutrition: Nutrition;
  usedAI: boolean; // true if a real Gemini result, false if mock
  error?: string; // populated when we fell back to mock after a failure
};

export function isAIConfigured(): boolean {
  return isGeminiConfigured();
}

export function aiStatusLabel(): string {
  return isGeminiConfigured() ? 'Gemini Vision (live)' : 'Demo mode (mock data)';
}

const MIN_MOCK_DELAY_MS = 900;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function analyzeFoodImage(base64: string, mimeType = 'image/jpeg'): Promise<AnalyzeResult> {
  if (isGeminiConfigured()) {
    try {
      const nutrition = await analyzeWithGemini(base64, mimeType);
      return { nutrition, usedAI: true };
    } catch (e: any) {
      // Fall back to mock so the user still gets a result.
      return { nutrition: mockAnalyze(), usedAI: false, error: e?.message ?? 'AI request failed' };
    }
  }
  // No key — simulate a brief analysis for realistic UX.
  await delay(MIN_MOCK_DELAY_MS);
  return { nutrition: mockAnalyze(), usedAI: false };
}
