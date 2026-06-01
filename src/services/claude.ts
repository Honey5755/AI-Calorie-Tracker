import Anthropic from '@anthropic-ai/sdk';

import type { Nutrition } from '@/lib/types';
import { NUTRITION_JSON_SCHEMA, NUTRITION_PROMPT, sanitizeNutrition } from './sanitize';

/**
 * Anthropic Claude vision call. Key from https://console.anthropic.com/settings/keys
 *
 * Security note: the key is read from EXPO_PUBLIC_ANTHROPIC_API_KEY and the call
 * is made directly from the client (`dangerouslyAllowBrowser`). Fine for this
 * demo; the production fix is a thin server proxy that holds the key. The SDK
 * auto-retries 429 / 5xx with exponential backoff (max_retries: 2).
 */

export const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
// Per Anthropic guidance, default to the most capable model; override for cost/speed
// (e.g. EXPO_PUBLIC_CLAUDE_MODEL=claude-haiku-4-5).
const MODEL = process.env.EXPO_PUBLIC_CLAUDE_MODEL ?? 'claude-opus-4-8';

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function isClaudeConfigured(): boolean {
  return CLAUDE_API_KEY.trim().length > 0;
}

export function claudeModel(): string {
  return MODEL;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: CLAUDE_API_KEY,
      dangerouslyAllowBrowser: true, // required to call the API from Expo web
    });
  }
  return _client;
}

// Structured-output schema: Claude requires `additionalProperties: false` on objects.
const STRICT_SCHEMA = { ...NUTRITION_JSON_SCHEMA, additionalProperties: false };

/** Analyze a base64-encoded image with Claude vision. Throws on failure. */
export async function analyzeWithClaude(base64: string, mimeType = 'image/jpeg'): Promise<Nutrition> {
  if (!isClaudeConfigured()) throw new Error('Claude API key not configured');
  const mediaType = ALLOWED_MEDIA.includes(mimeType) ? mimeType : 'image/jpeg';

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    // The system prompt is the stable prefix — cache it. (Only caches above the
    // model's minimum prefix size; harmless otherwise, and pays off if it grows.)
    system: [
      {
        type: 'text',
        text: 'You analyze food photos and return only structured nutrition JSON.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as any, data: base64 },
          },
          { type: 'text', text: NUTRITION_PROMPT },
        ],
      },
    ],
    // Force the response to match our nutrition schema.
    output_config: { format: { type: 'json_schema', schema: STRICT_SCHEMA } },
  } as any);

  const text = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('')
    .trim();
  if (!text) throw new Error('Claude returned no content');

  const parsed = JSON.parse(text);
  return sanitizeNutrition(parsed);
}
