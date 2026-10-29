import type { AiGenerationRequest, AiGenerationResponse, Focus } from '../shared/types';
import { aiRequestBodySchema, parseAiCombinations, parseAiPlanDraft } from '../shared/schemas';
import { buildAiPrompt } from './prompt';
import { resolveAllowedTechniques, sanitizeText, validateCombinations } from './validate';

export interface GenerateDeps {
  env: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => number;
  clientKey?: string;
  limiter?: RateLimiter;
}

export interface HandlerResult {
  status: number;
  body: AiGenerationResponse;
}

const DEFAULT_BASE_URL = 'https://router.requesty.ai/v1';
const REQUEST_TIMEOUT_MS = 50_000;

const PLAN_TITLES: Record<Focus, string> = {
  fundamentals: 'Clean Fundamentals',
  power: 'Heavy Hands',
  speed: 'Speed & Snap',
  defense: 'Untouchable',
  conditioning: 'Engine Builder',
  clinch: 'Inside Work',
};

const FOCUS_CUES: Record<Focus, string> = {
  fundamentals: 'Balance first. Finish every combination back in your stance.',
  power: 'Sit down on the shots, rotate through the hips, and exhale on impact.',
  speed: 'Stay loose, snap the shots back, and keep your feet moving.',
  defense: 'Hands high, chin down, and reset behind the guard after every exchange.',
  conditioning: 'Keep a steady pace. Breathe through the work and stay composed.',
  clinch: 'Control the posture, work short, and keep your base underneath you.',
};

export class RateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  take(key: string, now: number, limit = 10, windowMs = 60_000): boolean {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }
}

const defaultLimiter = new RateLimiter();

export async function generateHandler(
  rawBody: unknown,
  deps: GenerateDeps,
): Promise<HandlerResult> {
  const parsedBody = parseBody(rawBody);
  if (!parsedBody.ok) {
    return failure(400, 'INVALID_BODY', 'Send a valid JSON generation request.');
  }

  const requestResult = aiRequestBodySchema.safeParse(parsedBody.value);
  if (!requestResult.success) {
    return failure(400, 'INVALID_REQUEST', 'The generation request is missing or invalid.');
  }

  const request = requestResult.data as AiGenerationRequest;
  const { allowed, invalid } = resolveAllowedTechniques(request);
  if (invalid.length > 0) {
    return failure(
      400,
      'INVALID_TECHNIQUES',
      'The technique scope contains techniques that are unavailable for this discipline and level.',
    );
  }
  if (allowed.size < 2) {
    return failure(400, 'EMPTY_TECHNIQUE_SCOPE', 'Enable at least two valid techniques.');
  }

  const now = deps.now ?? Date.now;
  const limiter = deps.limiter ?? defaultLimiter;
  if (!limiter.take(deps.clientKey ?? 'anonymous', now())) {
    return failure(429, 'RATE_LIMITED', 'Too many AI requests. Wait a minute and try again.');
  }

  const apiKey = deps.env.REQUESTY_API_KEY?.trim();
  const model = deps.env.REQUESTY_MODEL?.trim();
  const baseUrl = (deps.env.REQUESTY_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');

  if (!apiKey || !model) {
    return failure(
      503,
      'AI_NOT_CONFIGURED',
      'AI generation is not configured on this deployment. Curated combinations are still available.',
    );
  }

  const { system, user } = buildAiPrompt(request, allowed);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const maxTokens = 4096;

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.65,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return failure(
      502,
      'AI_UNAVAILABLE',
      'The AI coach could not be reached. Curated combinations are ready to train.',
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      return failure(429, 'AI_RATE_LIMITED', 'The AI coach is busy right now. Try again shortly.');
    }
    return failure(
      502,
      'AI_UPSTREAM_ERROR',
      'The AI coach returned an error. Curated combinations are ready to train.',
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return failure(502, 'AI_BAD_RESPONSE', 'The AI coach sent an unreadable response.');
  }

  const content = extractContent(payload);
  if (!content) {
    return failure(502, 'AI_EMPTY_RESPONSE', 'The AI coach returned an empty response.');
  }

  const aiJson = extractJson(content);
  if (aiJson === null) {
    return failure(502, 'AI_INVALID_JSON', 'The AI coach returned invalid JSON.');
  }

  const context = {
    discipline: request.discipline,
    level: request.level,
    stance: request.stance,
    focus: request.focus,
    allowedTechniques: allowed,
  };

  if (request.mode === 'plan') {
    const draft = parseAiPlanDraft(aiJson);
    const rawCombinations = draft?.combinations ?? parseAiCombinations(aiJson)?.combinations;
    if (!rawCombinations) {
      return failure(502, 'AI_INVALID_PLAN', 'The AI coach returned an invalid workout plan.');
    }
    const validated = validateCombinations(rawCombinations, context);
    if (validated.combinations.length < 2) {
      return failure(
        502,
        'AI_DISALLOWED_TECHNIQUES',
        'The AI plan used disallowed techniques. Curated combinations are ready to train.',
      );
    }
    const settings = request.planSettings ?? {
      rounds: 6,
      roundSeconds: 180,
      restSeconds: 60,
    };
    return {
      status: 200,
      body: {
        ok: true,
        mode: 'plan',
        plan: {
          title:
            (draft ? sanitizeText(draft.title, 90) : '') ||
            `${PLAN_TITLES[request.focus]} · ${request.count} combinations`,
          focus: request.focus,
          rounds: settings.rounds,
          roundSeconds: settings.roundSeconds,
          restSeconds: settings.restSeconds,
          notes: (draft ? sanitizeText(draft.notes, 400) : '') || FOCUS_CUES[request.focus],
          combinations: validated.combinations.slice(0, 16),
        },
        rejected: validated.rejected,
      },
    };
  }

  const envelope = parseAiCombinations(aiJson);
  if (!envelope) {
    return failure(502, 'AI_INVALID_COMBINATIONS', 'The AI coach returned invalid combinations.');
  }
  const validated = validateCombinations(envelope.combinations, context);
  if (validated.combinations.length === 0) {
    return failure(
      502,
      'AI_DISALLOWED_TECHNIQUES',
      'The AI did not return usable combinations. Curated combinations are ready to train.',
    );
  }

  return {
    status: 200,
    body: {
      ok: true,
      mode: 'combinations',
      combinations: validated.combinations.slice(0, request.count),
      rejected: validated.rejected,
    },
  };
}

function parseBody(raw: unknown): { ok: true; value: unknown } | { ok: false } {
  if (typeof raw === 'string') {
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      return { ok: false };
    }
  }
  if (raw === null || raw === undefined) return { ok: false };
  return { ok: true, value: raw };
}

function extractContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (!first || typeof first !== 'object') return null;
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== 'object') return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' ? content : null;
}

export function extractJson(content: string): unknown | null {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const candidates = [unfenced];
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start !== -1 && end > start) {
    candidates.push(unfenced.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next extraction strategy.
    }
  }
  return null;
}

function failure(status: number, code: string, message: string): HandlerResult {
  return {
    status,
    body: {
      ok: false,
      error: { code, message },
      fallback: 'curated',
    },
  };
}
