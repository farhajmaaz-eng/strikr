# STRIKR

A mobile-first striking training studio for boxing, kickboxing, and Muay Thai. Build a session, hear stance-aware combinations through speech synthesis, and train with a timestamp-based timer that keeps working when the tab sleeps.

STRIKR is local-first: settings, custom combinations, favorites, and session history stay in the browser. AI generation is optional and runs through a server-side Requesty function, so the API key never reaches the client.

## Features

- **Live workouts** — count-in, work rounds, rest rounds, pause/resume, skip, end early, and a post-session summary.
- **Honest timing** — a pure timestamp timer computes the clock from `Date.now()` instead of decrementing a counter, so throttled tabs do not lose time.
- **Stance-aware callouts** — 36 techniques and 55 curated combinations rendered as lead/rear for orthodox or southpaw fighters. Spoken callouts use the browser's SpeechSynthesis API.
- **Synthesized bells** — Web Audio bells for round starts, ends, count-ins, and completion. No external audio files.
- **Three disciplines, three levels** — boxing, kickboxing, and Muay Thai, with beginner through advanced technique scopes.
- **Combination library** — curated and custom combinations, favorites, search, filters, duplicate prevention, and an editor.
- **AI coach** — generate validated combination batches or a complete session plan with `nvidia/nemotron-3.5-lightning-30b-a3b` through Requesty.
- **Strict validation** — request and response schemas with Zod, plus domain checks that reject unknown, out-of-discipline, or out-of-level techniques. Invalid AI suggestions are filtered or refused.
- **Curated fallback** — if the API is missing, offline, rate-limited, slow, or returns bad data, the app offers curated combinations instead.
- **Local history** — completed sessions, rounds, training time, skipped rounds, and combinations thrown are stored on-device.
- **PWA** — installable manifest, generated icons, and a Workbox service worker with app-shell precaching for offline use.

## Stack

- React 19 + TypeScript 6
- Vite 8
- Tailwind CSS 4
- React Router 7
- Zod 4
- Lucide icons
- Vitest 5
- `vite-plugin-pwa` / Workbox
- Vercel serverless function for the Requesty proxy

## Quick start

Requirements: Node.js 22.12 or newer and npm.

```bash
npm install
cp .env.example .env.local
# add your Requesty credentials to .env.local
npm run dev
```

Open the printed local URL. The AI page calls `/api/generate`; plain `vite dev` does not serve that function. To exercise the full stack locally, use Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Everything except AI generation works without credentials.

## Environment variables

These are server-only. Never prefix them with `VITE_`, which would expose them to the browser.

| Variable | Required | Description |
| --- | --- | --- |
| `REQUESTY_API_KEY` | For AI | Requesty API key. |
| `REQUESTY_MODEL` | For AI | Model ID. Defaults in `.env.example` to `nvidia/nemotron-3.5-lightning-30b-a3b`. |
| `REQUESTY_BASE_URL` | No | Requesty router base URL. Defaults to `https://router.requesty.ai/v1`. |

The client posts only workout parameters to `/api/generate`. The function builds the prompt, calls Requesty, validates the result, and returns sanitized JSON.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and build the production bundle plus service worker. |
| `npm run preview` | Preview the built client locally. AI routes need Vercel. |
| `npm run typecheck` | Run the TypeScript project build with no emit checks beyond the build config. |
| `npm run lint` | Run ESLint over the repository. |
| `npm run test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run check` | Typecheck, lint, test, and build. |
| `npm run icons` | Regenerate PWA and favicon PNGs from the SVG mark (requires `sharp`). |

## Architecture

```text
api/
  generate.ts          Vercel function wrapper: method guard, client key, rate limit
server/
  generate.ts          Requesty call, response extraction, plan assembly, error mapping
  prompt.ts            Strict system and user prompts
  validate.ts          Technique-scope, discipline, level, duplicate, and sanitization checks
shared/
  types.ts             Domain types, enums, settings and session shapes
  techniques.ts        36-technique catalog and stance-aware rendering
  combinations.ts      55 curated combinations, signatures, render helpers
  schemas.ts           Zod request and AI-output schemas
src/
  pages/               Home, setup, workout/summary, combos, AI, history, settings
  lib/timer.ts         Timestamp-based workout state machine
  lib/prepare-workout.ts  Builds the local callout queue for a run
  lib/storage.ts       Validated localStorage persistence
  lib/audio.ts         Web Audio bells
  lib/speech.ts        SpeechSynthesis wrapper
tests/                 Timer, validation, API fallback, persistence, combination tests
```

### AI request flow

1. The AI page sends `mode` (`combinations` or `plan`), discipline, stance, level, focus, count, allowed technique IDs, and optional plan timing settings.
2. The function validates the body with Zod and resolves every technique against the server-side catalog.
3. Requesty is called with a strict prompt that allows only the canonical technique IDs.
4. The response is extracted from raw JSON or fenced JSON, then parsed with Zod.
5. A second domain pass rejects unknown IDs, techniques outside the discipline/level, invalid levels, and duplicate sequences.
6. Plan mode asks the model for a title, coaching note, and combinations, then applies the fighter's chosen rounds, round length, and rest server-side. This keeps plans fast and makes timing deterministic.
7. On any failure the API returns a typed error with `fallback: "curated"`, and the UI offers curated combinations without blocking training.

Rate limiting is in-memory per function instance (10 requests per client per minute). That is a best-effort guard, not a durable global quota; use an external store if you need hard limits across instances.

### Local data

Storage keys are versioned under `strikr.*.v1` in localStorage:

- settings
- custom combinations (max 200)
- favorites
- completed sessions (max 100)

Reads are defensive: corrupt JSON, unknown enum values, bad numbers, and malformed sessions fall back to sanitized defaults instead of crashing. An active workout is kept in sessionStorage so a refresh can restore the prepared run.

## Testing

```bash
npm run check
```

The suite covers:

- timestamp timer transitions, pause/resume, skipping, end-early, and background-style time jumps
- AI body validation, technique rejection, invalid JSON, rate limits, upstream errors, and curated fallback
- plan assembly and validation
- localStorage corruption and sanitization
- curated combination integrity and duplicate signatures

Live AI calls are not part of the test suite. They require credentials and are verified manually with the server handler.

## Deployment

The repository is ready for Vercel.

```bash
vercel link
vercel env add REQUESTY_API_KEY production
vercel env add REQUESTY_MODEL production
vercel env add REQUESTY_BASE_URL production
vercel --prod
```

`vercel.json` sets the Vite build, `dist` output, SPA rewrites that preserve `/api/*`, asset caching, security headers, and a 60-second maximum duration for the AI function.

The AI handler times out upstream requests at 45 seconds and returns a curated fallback instead of hanging the UI.

## Privacy

- No accounts, analytics, or tracking.
- Training data stays in the browser unless the user explicitly calls the AI feature, which sends only the selected workout parameters and technique IDs.
- The Requesty key is read from server environment variables and is never serialized into the client bundle.

## Notes and limits

- Speech voices depend on the browser and operating system. The Settings screen lists available English voices and includes a test button.
- Wake Lock is used where supported and is released when the session ends or the page is hidden.
- The AI rate limiter is per instance; serverless cold starts reset it.
- The service worker caches the app shell and static assets. AI requests always need a network connection.
