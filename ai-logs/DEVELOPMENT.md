# NutriSnap — AI-Assisted Development Log

This document summarizes how **NutriSnap** was built with **Claude Code** (Anthropic's CLI),
including the key decisions, prompts, and iteration loops. The complete, unedited session
transcript is in the accompanying `.jsonl` file; this is the readable narrative of that process.

---

## Approach

I worked with the AI agent iteratively — scoping the problem first, then building in vertical
slices (data model → state → UI → AI integration), verifying each slice in a real browser via
screenshots before moving on. Where something didn't work, I fed the exact error back and we
diagnosed it together rather than guessing.

**Stack decisions made up front:** React Native + Expo (Expo Router) targeting web for the demo,
TypeScript throughout, Zustand + AsyncStorage for offline-first state, `react-native-svg` for the
rings/charts, and a pluggable AI layer so the food-recognition provider could be swapped.

---

## Build phases

### 1. Architecture & scaffolding
Set up an Expo Router app with a clean separation of concerns: pure logic in `lib/`, a single
AI service in `services/`, a Zustand store in `store/`, and reusable components. Established the
dark, mint-accented design system in `theme/` and seeded realistic demo data so every screen
looked alive from the first run.

### 2. Core diary experience
Built the hero **calorie ring** and **macro progress rings** (one reusable SVG primitive),
the daily diary with a running total, per-meal cards, and the camera-driven **Add** flow:
`pick image → analyze → editable review → save`.

### 3. AI integration (the core feature)
Designed food recognition as a **pluggable provider** behind one service so the UI never talks to
a model directly. Implemented three providers — **Google Gemini**, **Anthropic Claude**
(`@anthropic-ai/sdk`, structured outputs + prompt caching), and **NVIDIA NIM** (OpenAI-compatible
Llama-4 vision) — sharing one prompt/schema/sanitizer. Every provider falls back to a realistic
mock on any failure, so the app never dead-ends. Auto-selection order: Claude → Gemini → NVIDIA → mock.

### 4. Debugging & iteration (highlights)
A few real problems surfaced and were fixed by feeding errors back to the agent:
- **Static web rendering** crashed (`window is not defined`) because storage touched `localStorage`
  during SSR → switched `web.output` to SPA.
- **SVG ring fills** wouldn't animate on `react-native-web` → rewrote the ring to drive its arc from
  React state (with a timer fallback so it always lands correctly).
- **Responsive layout** stretched on desktop → switched to an explicit centered max-width column.
- **NVIDIA CORS**: the browser blocks NVIDIA's API directly → added a tiny zero-dependency local
  proxy that holds the key server-side and adds CORS; the web client routes through it.
- **Navigation**: a `GO_BACK` warning on direct `/add` loads → safe close that falls back to the Diary.

### 5. Feature expansion
Added a 5-step **onboarding quiz** computing calorie + macro targets via the **Mifflin–St Jeor**
formula; **meal-type grouping** (breakfast/lunch/dinner); a GitHub-style **streak heatmap**; and a
tap-through **day-detail** screen for any past day.

### 6. UI modernization & branding
Added a soft brand **glow backdrop**, **gradient CTAs**, animated step transitions, count-up numbers,
and a custom **app icon / splash / favicon**.

---

## Engineering decisions & tradeoffs
- **Client-side API keys** (`EXPO_PUBLIC_*`) are acceptable for a zero-backend demo; the production
  fix (a server proxy) is documented in code and was actually implemented for NVIDIA.
- **Static ring rendering with a timer-backed animation** trades a little purity for reliable
  rendering across web capture and real browsers.
- **Secrets hygiene:** `.env` is gitignored and the log-sync script auto-redacts key patterns before
  anything is committed.

---

## Verification
Every screen was validated by exporting the web build and capturing it headlessly, iterating on the
result until the layout and visuals were correct — not just assumed to work.
