import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import type { Nutrition } from '@/lib/types';
import { NUTRITION_PROMPT, extractJsonObject, sanitizeNutrition } from './sanitize';

/**
 * NVIDIA NIM vision call (build.nvidia.com — free developer credits).
 * The endpoint is OpenAI-compatible, so we call it with plain `fetch`.
 *
 * Constraint: NVIDIA's inline base64 images must stay small (~180KB), so we
 * downscale the photo with expo-image-manipulator before sending. Key from
 * https://build.nvidia.com (starts with "nvapi-").
 *
 * Security note: the key is read from EXPO_PUBLIC_NVIDIA_API_KEY and the call is
 * client-side — fine for a demo; a server proxy is the production fix.
 */

const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const NVIDIA_API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY ?? '';
// Must be a "Free Endpoint" multimodal model on build.nvidia.com (the Llama 3.2
// vision models are "Downloadable" only — no hosted API). Llama 4 Maverick is
// both multimodal and free-hosted.
const MODEL = process.env.EXPO_PUBLIC_NVIDIA_MODEL ?? 'meta/llama-4-maverick-17b-128e-instruct';

export function isNvidiaConfigured(): boolean {
  return NVIDIA_API_KEY.trim().length > 0;
}

export function nvidiaModel(): string {
  return MODEL;
}

const PROMPT = `${NUTRITION_PROMPT}\n\nReturn ONLY the raw JSON object — no markdown, no code fences, no extra text.`;

/** Shrink the image so its base64 stays under NVIDIA's inline limit. */
async function smallBase64(uri: string | undefined, fallbackB64: string): Promise<string> {
  if (!uri) return fallbackB64;
  try {
    const out = await manipulateAsync(uri, [{ resize: { width: 512 } }], {
      compress: 0.45,
      format: SaveFormat.JPEG,
      base64: true,
    });
    return out.base64 ?? fallbackB64;
  } catch {
    return fallbackB64;
  }
}

/** Analyze a food image with an NVIDIA-hosted vision model. Throws on failure. */
export async function analyzeWithNvidia(
  base64: string,
  _mimeType = 'image/jpeg',
  uri?: string
): Promise<Nutrition> {
  if (!isNvidiaConfigured()) throw new Error('NVIDIA API key not configured');

  const b64 = await smallBase64(uri, base64);
  // ~180KB inline cap; b64 length * 0.75 ≈ bytes.
  if (b64.length * 0.75 > 180_000) {
    throw new Error('Image too large for NVIDIA inline API (use Claude/Gemini for big photos)');
  }

  const body = {
    model: MODEL,
    max_tokens: 512,
    temperature: 0.2,
    stream: false,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
        ],
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // NVIDIA's API does not send CORS headers, so a browser blocks it ("Failed to fetch").
    if (Platform.OS === 'web') {
      throw new Error(
        "NVIDIA can't be reached from a web browser (CORS). Use Gemini on web, or run the app on a phone via Expo Go."
      );
    }
    throw e;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`NVIDIA ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('NVIDIA returned no content');

  return sanitizeNutrition(extractJsonObject(text));
}
