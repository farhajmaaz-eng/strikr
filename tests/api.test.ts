import { describe, expect, it, vi } from 'vitest';
import type { AiGenerationRequest } from '../shared/types';
import {
  RateLimiter,
  extractJson,
  generateHandler,
  type GenerateDeps,
} from '../server/generate';

const request: AiGenerationRequest = {
  mode: 'combinations',
  discipline: 'boxing',
  stance: 'orthodox',
  level: 'beginner',
  focus: 'fundamentals',
  count: 4,
  allowedTechniques: ['jab', 'cross', 'lead-hook', 'slip'],
};

const env = {
  REQUESTY_API_KEY: 'test-secret-key',
  REQUESTY_MODEL: 'nvidia/nemotron-3.5-lightning-30b-a3b',
  REQUESTY_BASE_URL: 'https://router.requesty.ai/v1',
};

const validCombinations = {
  combinations: [
    { name: 'One two', steps: ['jab', 'cross'], focus: 'fundamentals', level: 'beginner' },
    {
      name: 'Slip hook',
      steps: ['slip', 'lead-hook', 'cross'],
      focus: 'defense',
      level: 'beginner',
    },
  ],
};

function deps(overrides: Partial<GenerateDeps> = {}): GenerateDeps {
  return {
    env,
    limiter: new RateLimiter(),
    clientKey: 'test-client',
    now: () => 1_000,
    ...overrides,
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function chatResponse(content: unknown): Response {
  return jsonResponse({
    choices: [{ message: { role: 'assistant', content: JSON.stringify(content) } }],
  });
}

describe('AI generation handler', () => {
  it('returns validated combinations and calls Requesty with server-side config', async () => {
    const fetchMock = vi.fn(async () => chatResponse(validCombinations));
    const result = await generateHandler(request, deps({ fetchImpl: fetchMock }));

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    if (!result.body.ok || result.body.mode !== 'combinations') return;
    expect(result.body.combinations).toHaveLength(2);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://router.requesty.ai/v1/chat/completions');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-secret-key',
    });
    const body = JSON.parse(String(init.body)) as { model: string; messages: unknown[] };
    expect(body.model).toBe('nvidia/nemotron-3.5-lightning-30b-a3b');
    expect(body.messages).toHaveLength(2);
    expect(JSON.stringify(result.body)).not.toContain('test-secret-key');
  });

  it('returns a 503 with a curated fallback when credentials are missing', async () => {
    const result = await generateHandler(request, deps({ env: {} }));
    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({
      ok: false,
      fallback: 'curated',
      error: { code: 'AI_NOT_CONFIGURED' },
    });
  });

  it('surfaces upstream rate limits and network failures as friendly errors', async () => {
    const rateLimited = await generateHandler(
      request,
      deps({
        fetchImpl: vi.fn(async () => jsonResponse({ error: 'busy' }, 429)),
      }),
    );
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.body.ok).toBe(false);

    const offline = await generateHandler(
      request,
      deps({
        fetchImpl: vi.fn(async () => {
          throw new Error('network down');
        }),
      }),
    );
    expect(offline.status).toBe(502);
    expect(offline.body).toMatchObject({
      ok: false,
      error: { code: 'AI_UNAVAILABLE' },
      fallback: 'curated',
    });
  });

  it('rejects AI output that uses unknown or disallowed techniques', async () => {
    const result = await generateHandler(
      request,
      deps({
        fetchImpl: vi.fn(async () =>
          chatResponse({
            combinations: [
              { name: 'Kick', steps: ['jab', 'rear-knee'] },
              { name: 'Invented', steps: ['jab', 'laser'] },
            ],
          }),
        ),
      }),
    );
    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({
      ok: false,
      error: { code: 'AI_DISALLOWED_TECHNIQUES' },
    });
  });

  it('rejects invalid AI JSON and malformed request bodies', async () => {
    const badJson = await generateHandler(
      request,
      deps({
        fetchImpl: vi.fn(async () =>
          jsonResponse({ choices: [{ message: { content: 'not json' } }] }),
        ),
      }),
    );
    expect(badJson.status).toBe(502);
    expect(badJson.body).toMatchObject({ ok: false, error: { code: 'AI_INVALID_JSON' } });

    const badRequest = await generateHandler({ mode: 'combinations' }, deps());
    expect(badRequest.status).toBe(400);
    expect(badRequest.body).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('validates and returns a complete workout plan', async () => {
    const draft = {
      title: 'Six-round sharpening',
      notes: 'Long guard, short combinations.',
      combinations: [
        { name: 'One two', steps: ['jab', 'cross'], level: 'beginner' },
        { name: 'Slip counter', steps: ['slip', 'cross', 'lead-hook'], level: 'beginner' },
      ],
    };
    const result = await generateHandler(
      {
        ...request,
        mode: 'plan',
        count: 3,
        planSettings: { rounds: 8, roundSeconds: 120, restSeconds: 45 },
      },
      deps({ fetchImpl: vi.fn(async () => chatResponse(draft)) }),
    );
    expect(result.status).toBe(200);
    if (!result.body.ok || result.body.mode !== 'plan') return;
    expect(result.body.plan.title).toBe('Six-round sharpening');
    expect(result.body.plan.rounds).toBe(8);
    expect(result.body.plan.roundSeconds).toBe(120);
    expect(result.body.plan.restSeconds).toBe(45);
    expect(result.body.plan.combinations).toHaveLength(2);
  });

  it('rate limits repeated requests per client', async () => {
    const limiter = new RateLimiter();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const result = await generateHandler(request, deps({ limiter, env: {} }));
      expect(result.status).toBe(503);
    }
    const limited = await generateHandler(request, deps({ limiter, env: {} }));
    expect(limited.status).toBe(429);
    expect(limited.body).toMatchObject({ ok: false, error: { code: 'RATE_LIMITED' } });
  });

  it('extracts JSON from fenced responses and surrounding prose', () => {
    expect(extractJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
    expect(extractJson('Here is the set: {"ok":true} — go.')).toEqual({ ok: true });
    expect(extractJson('no object here')).toBeNull();
  });
});
