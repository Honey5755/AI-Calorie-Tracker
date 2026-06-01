import type { Nutrition } from '@/lib/types';
import { caloriesFromMacros } from '@/lib/nutrition';

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

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    servingDesc: { type: 'string' },
    calories: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    confidence: { type: 'number' },
  },
  required: ['name', 'servingDesc', 'calories', 'protein', 'carbs', 'fat'],
};

const PROMPT = `You are a nutrition expert. Analyze the food in this photo and estimate its nutrition for the portion visible.
Return ONLY JSON matching the schema:
- name: short dish name (e.g. "Grilled Chicken Salad")
- servingDesc: the portion you estimated (e.g. "1 plate (~350g)")
- calories: total kcal (integer)
- protein, carbs, fat: grams (integers)
- confidence: 0..1 how confident you are in the identification
Be realistic. If multiple foods are present, sum them and name the overall meal.`;

function clampNum(v: unknown, min = 0, max = 100000): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!isFinite(n)) return 0;
  return Math.round(Math.min(max, Math.max(min, n)));
}

function sanitize(raw: any): Nutrition {
  const macros = {
    protein: clampNum(raw?.protein, 0, 500),
    carbs: clampNum(raw?.carbs, 0, 800),
    fat: clampNum(raw?.fat, 0, 400),
  };
  let calories = clampNum(raw?.calories, 0, 6000);
  // If the model's calorie number is wildly off from its macros, trust the macros.
  const fromMacros = caloriesFromMacros(macros);
  if (calories === 0 || Math.abs(calories - fromMacros) > Math.max(120, fromMacros * 0.6)) {
    calories = fromMacros || calories;
  }
  const confidence =
    typeof raw?.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.8;
  return {
    name: String(raw?.name || 'Food').slice(0, 60),
    servingDesc: String(raw?.servingDesc || '1 serving').slice(0, 60),
    calories,
    ...macros,
    confidence,
  };
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
        parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const res = await postWithRetry(body);

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  const parsed = JSON.parse(text);
  return sanitize(parsed);
}
