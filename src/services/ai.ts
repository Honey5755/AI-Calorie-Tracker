import type { Nutrition } from '@/lib/types';
import { analyzeWithClaude, claudeModel, isClaudeConfigured } from './claude';
import { analyzeWithGemini, isGeminiConfigured } from './gemini';
import { mockAnalyze } from './mockAnalyzer';

/**
 * Single source of truth for food recognition. Screens call only this.
 *
 * Pluggable provider:
 *   - Claude vision  (EXPO_PUBLIC_ANTHROPIC_API_KEY)
 *   - Gemini vision  (EXPO_PUBLIC_GEMINI_API_KEY)
 *   - Mock fallback  (no key, or whenever a real call fails — the demo never breaks)
 *
 * Force a provider with EXPO_PUBLIC_AI_PROVIDER = "claude" | "gemini" | "mock".
 * Otherwise we auto-pick: Claude → Gemini → mock.
 */

type Provider = 'claude' | 'gemini' | 'mock';

function resolveProvider(): Provider {
  const forced = (process.env.EXPO_PUBLIC_AI_PROVIDER ?? '').trim().toLowerCase();
  if (forced === 'claude' || forced === 'gemini' || forced === 'mock') return forced;
  if (isClaudeConfigured()) return 'claude';
  if (isGeminiConfigured()) return 'gemini';
  return 'mock';
}

export type AnalyzeResult = {
  nutrition: Nutrition;
  usedAI: boolean; // true for a real provider result, false for mock
  error?: string; // populated when we fell back to mock after a failure
};

export function isAIConfigured(): boolean {
  const p = resolveProvider();
  return p === 'claude' || p === 'gemini';
}

export function aiStatusLabel(): string {
  switch (resolveProvider()) {
    case 'claude':
      return `Claude Vision · ${claudeModel()} (live)`;
    case 'gemini':
      return 'Gemini Vision (live)';
    default:
      return 'Demo mode (mock data)';
  }
}

const MIN_MOCK_DELAY_MS = 900;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function analyzeFoodImage(base64: string, mimeType = 'image/jpeg'): Promise<AnalyzeResult> {
  const provider = resolveProvider();

  if (provider === 'mock') {
    await delay(MIN_MOCK_DELAY_MS); // simulate a brief analysis for realistic UX
    return { nutrition: mockAnalyze(), usedAI: false };
  }

  try {
    const nutrition =
      provider === 'claude'
        ? await analyzeWithClaude(base64, mimeType)
        : await analyzeWithGemini(base64, mimeType);
    return { nutrition, usedAI: true };
  } catch (e: any) {
    // Fall back to mock so the user still gets an editable result.
    return { nutrition: mockAnalyze(), usedAI: false, error: e?.message ?? 'AI request failed' };
  }
}
