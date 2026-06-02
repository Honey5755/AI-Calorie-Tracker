#!/usr/bin/env node
/**
 * Tiny zero-dependency CORS proxy for the NVIDIA NIM API.
 *
 * NVIDIA's API doesn't send CORS headers, so a browser can't call it directly.
 * This proxy runs locally, holds the key server-side, adds CORS headers, and
 * forwards requests to NVIDIA. The web app calls THIS instead of NVIDIA directly.
 *
 * Run it alongside Expo:   npm run nvidia-proxy   (then `npx expo start` in another tab)
 * Key is read from .env (EXPO_PUBLIC_NVIDIA_API_KEY) or the NVIDIA_API_KEY env var.
 */
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.NVIDIA_PROXY_PORT ?? 8787);
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

function readKey() {
  if (process.env.NVIDIA_API_KEY) return process.env.NVIDIA_API_KEY.trim();
  try {
    const env = readFileSync(join(__dirname, '..', '.env'), 'utf8');
    const m = env.match(/^\s*EXPO_PUBLIC_NVIDIA_API_KEY\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim();
  } catch {}
  return '';
}

const KEY = readKey();
if (!KEY) {
  console.error('✗ No NVIDIA key found. Put EXPO_PUBLIC_NVIDIA_API_KEY in .env, or set NVIDIA_API_KEY.');
  process.exit(1);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, CORS);
    res.end('Only POST');
    return;
  }

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    try {
      const upstream = await fetch(NVIDIA_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { ...CORS, 'Content-Type': 'application/json' });
      res.end(text);
    } catch (e) {
      res.writeHead(502, { ...CORS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e?.message ?? e) }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`✓ NVIDIA proxy running at http://localhost:${PORT}`);
  console.log(`  Web app will route NVIDIA calls through it. Keep this running alongside Expo.`);
});
