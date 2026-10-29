import type { AiGenerationRequest, AiGenerationResponse } from '../../shared/types';

type AiGenerationSuccess = Extract<AiGenerationResponse, { ok: true }>;

export class AiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'AI_CLIENT_ERROR', status = 0) {
    super(message);
    this.name = 'AiClientError';
    this.code = code;
    this.status = status;
  }
}

export interface AiClientOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export async function generateWithAi(
  request: AiGenerationRequest,
  options: AiClientOptions = {},
): Promise<AiGenerationSuccess> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const signal = options.signal ?? AbortSignal.timeout(55_000);

  let response: Response;
  try {
    response = await fetchImpl('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    throw new AiClientError(
      'Could not reach the AI coach. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiClientError(
      'The AI coach sent an unreadable response. Curated combinations are still ready.',
      'BAD_RESPONSE',
      response.status,
    );
  }

  if (!payload || typeof payload !== 'object' || !('ok' in payload)) {
    throw new AiClientError(
      'The AI coach sent an unexpected response.',
      'BAD_RESPONSE',
      response.status,
    );
  }

  const typed = payload as AiGenerationResponse;
  if (!typed.ok) {
    throw new AiClientError(
      typed.error.message || 'AI generation failed. Curated combinations are still ready.',
      typed.error.code,
      response.status,
    );
  }

  return typed;
}
