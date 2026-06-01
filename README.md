# 🥗 NutriSnap — AI Calorie Tracker

Snap a photo of any meal and instantly get calories, macros, and a full nutritional
breakdown powered by AI. NutriSnap is a Cal AI–style calorie tracker built with
**React Native + Expo**, with a polished daily diary, macro progress rings, weekly
history charts, and streak tracking.

> Built for the *Cal AI Clone* challenge. Runs as a web app (and on iOS/Android via Expo).

## ✨ Features

- 📷 **AI food recognition** — photograph or upload a meal; Google **Gemini Vision** identifies the dish and estimates calories + protein/carbs/fat.
- ✍️ **Review & edit** — every AI result is fully editable before saving (name, serving, calories, macros) with an AI-confidence indicator.
- 📔 **Daily diary** — running calorie total with a hero **calorie ring** and per-meal cards.
- 🎯 **Macro progress rings** — protein, carbs and fat each get an SVG ring vs. your goal.
- 📊 **Weekly insights** — 7-day calorie bar chart with a goal line, daily average, days-on-track, and average macros.
- 🔥 **Streak tracking** — consecutive days with a logged meal, plus your best streak.
- ⚙️ **Editable goals** — set calorie & macro targets on the Profile tab (sensible defaults out of the box).
- 💾 **Offline-first** — everything persists locally (AsyncStorage / localStorage). Works with **zero backend**.
- 🧪 **Graceful fallback** — no API key? The app runs in demo mode with realistic mock results, so it never breaks.

## 📸 Screenshots

| Diary | Insights | Add (AI) | Review | Profile |
|---|---|---|---|---|
| ![Diary](docs/screenshots/01-diary.png) | ![Insights](docs/screenshots/02-insights.png) | ![Add](docs/screenshots/03-add.png) | ![Review](docs/screenshots/04-review.png) | ![Profile](docs/screenshots/05-profile.png) |

## 🚀 Getting started

```bash
npm install
npm run web        # opens the app in your browser (or: npx expo start)
```

Then press `w` for web, `i` for iOS simulator, or scan the QR code with **Expo Go**.

### Enable real AI (free)

The app works immediately in **demo mode**. To turn on live recognition:

1. Get a **free** Gemini API key at <https://aistudio.google.com/apikey>.
2. Copy `.env.example` → `.env` and paste your key:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
3. Restart `npx expo start`. The Profile tab shows **“Gemini Vision (live)”** when active.

## 🧠 AI integration

Food recognition lives behind a single service (`src/services/ai.ts`) so the UI never
talks to a provider directly:

- **`gemini.ts`** sends the base64 image + a nutrition prompt to `gemini-2.0-flash`, using
  Gemini's **structured output** (`responseMimeType: application/json` + `responseSchema`)
  to force a typed `{ name, servingDesc, calories, protein, carbs, fat, confidence }` result.
- Responses are **sanitized**: numbers are clamped to sane ranges, and if the model's
  calorie figure disagrees badly with its own macros, we recompute from macros (4/4/9 kcal/g).
- **`ai.ts`** decides Gemini vs. mock based on whether a key is set, and **falls back to mock
  on any network/parse error** — the demo never dead-ends.

> **Security note:** the key is read from `EXPO_PUBLIC_GEMINI_API_KEY` and the call is made
> client-side. That's fine for a demo; the production fix is a thin server proxy that holds
> the key. This is documented in `gemini.ts`.

## 🏗️ Architecture

```
src/
  app/                      # Expo Router (file-based routing)
    _layout.tsx             # root stack (tabs + add modal), dark theme
    (tabs)/
      _layout.tsx           # bottom tabs + center "scan" FAB
      index.tsx             # Diary: calorie ring, macro rings, today's meals
      insights.tsx          # weekly chart, stats, streak
      profile.tsx           # editable goals + AI status
    add.tsx                 # pick → analyze → review → save (modal)
  components/                # CalorieRing, MacroRings, ProgressRing, MealCard,
                             # WeeklyBarChart, StreakBadge, Card, Screen, EmptyState
  services/                  # ai.ts (entry), gemini.ts, mockAnalyzer.ts
  store/                     # useDiaryStore.ts (zustand + persist), seed.ts
  lib/                       # nutrition.ts, streak.ts, date.ts, types.ts (pure logic)
  theme/                     # colors, spacing, radius, fonts
```

Principles: **pure logic in `lib/`** (totals, streaks, dates — easy to read/test),
a **single AI source of truth** in `services/`, and **one reusable SVG ring** primitive
that powers both the calorie ring and the three macro rings.

## 🛠️ Tech stack

React Native · Expo (SDK 56) · Expo Router · TypeScript · Zustand · AsyncStorage ·
react-native-svg · expo-image-picker · Google Gemini Vision.

## 🤔 Reflection

**What was easy.** Expo + Expo Router made the multi-screen structure quick to stand up,
and Gemini's structured-output mode meant the AI returned clean typed JSON instead of prose
to parse. Keeping all nutrition math as pure functions let the diary, rings, and charts share
one source of truth.

**What was tricky.** Two web-specific gotchas: (1) Expo's default **static web rendering**
prerenders in Node, where `window`/`localStorage` don't exist — switching `web.output` to
`single` (SPA) fixed it. (2) Animating SVG `strokeDashoffset` via React Native's `Animated`
is unreliable on `react-native-web`, so the progress rings render their arc from real React
state instead. Getting a responsive, centered layout right across phone and desktop widths
also took iteration.

**What I'd change with more time.** Add a server proxy for the API key, multi-item detection
per photo, a barcode / manual-search database for packaged foods, and per-meal grouping
(breakfast / lunch / dinner). I'd also add unit tests around `lib/streak.ts` and `lib/nutrition.ts`.

## 📁 AI logs

The `/ai-logs` folder contains the Claude Code conversation used to build this app.
Re-sync with `bash scripts/sync-ai-logs.sh`.
