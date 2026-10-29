import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RateLimiter, generateHandler } from './generate';

const limiter = new RateLimiter();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for AI generation.' },
      fallback: 'curated',
    });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const clientKey = forwardedValue?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'anonymous';

  const result = await generateHandler(req.body, {
    env: process.env,
    clientKey,
    limiter,
  });

  res.status(result.status).json(result.body);
}
