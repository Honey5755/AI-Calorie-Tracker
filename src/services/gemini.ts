import type { Nutrition } from '@/lib/types';
import { NUTRITION_JSON_SCHEMA, NUTRITION_PROMPT, sanitizeNutrition } from './sanitize';

/**
 * Google Gemini vision call. Free key from https://aistudio.google.com/apikey
 *
 * Security note: calling Gemini directly from the client exposes the API key in
 * the bundle/network. That's acceptable for this demo; the production fix is a
 * thin server proxy that holds the key. We intentionally keep it client-side so
 * the app runs with zero backend.
 */

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.trim().length > 0;
}

const MAX_RETRIES = 2;
const MAX_WAIT_MS = 8000; // if Gemini asks us to wait longer than this, fail fast to mock

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse a retry delay (ms) from a 429/503 response, else exponential backoff. */
function retryDelayMs(res: Response, bodyText: string, attempt: number): number {
  const header = res.headers.get('retry-after');
  if (header && /^\d+$/.test(header)) return Number(header) * 1000;
  const match = bodyText.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  if (match) return Math.ceil(Number(match[1]) * 1000);
  return 1500 * Math.pow(2, attempt); // 1.5s, 3s, ...
}

/** POST with one or two retries on transient 429/503 (honoring the server's retry hint). */
async function postWithRetry(body: unknown): Promise<Response> {
  const url = `${ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;

    const txt = await res.text().catch(() => '');
    const transient = res.status === 429 || res.status === 503;
    if (transient && attempt < MAX_RETRIES) {
      const wait = retryDelayMs(res, txt, attempt);
      if (wait <= MAX_WAIT_MS) {
        await delay(wait);
        continue; // retry
      }
    }
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
  }
}

/** Analyze a base64-encoded image with Gemini. Throws on network/parse failure. */
export async function analyzeWithGemini(base64: string, mimeType = 'image/jpeg'): Promise<Nutrition> {
  if (!isGeminiConfigured()) throw new Error('Gemini API key not configured');

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: NUTRITION_PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      responseSchema: NUTRITION_JSON_SCHEMA,
    },
  };

  const res = await postWithRetry(body);

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  const parsed = JSON.parse(text);
  return sanitizeNutrition(parsed);
}
