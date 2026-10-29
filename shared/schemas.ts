import { z } from 'zod';
import { DISCIPLINES, FOCUSES, LEVELS, STANCES } from './types';

export const disciplineSchema = z.enum(DISCIPLINES);
export const stanceSchema = z.enum(STANCES);
export const levelSchema = z.enum(LEVELS);
export const focusSchema = z.enum(FOCUSES);

export const aiRequestBodySchema = z
  .object({
    mode: z.enum(['combinations', 'plan']),
    discipline: disciplineSchema,
    stance: stanceSchema,
    level: levelSchema,
    focus: focusSchema,
    count: z.number().int().min(3).max(12),
    allowedTechniques: z.array(z.string().trim().min(1).max(64)).min(1).max(60),
    planSettings: z
      .object({
        rounds: z.number().int().min(1).max(20),
        roundSeconds: z.number().int().min(30).max(600),
        restSeconds: z.number().int().min(0).max(180),
      })
      .strict()
      .optional(),
  })
  .strict();

const aiCombinationSchema = z
  .object({
    name: z.string().trim().min(1).max(70),
    steps: z.array(z.string().trim().min(1).max(64)).min(2).max(8),
    focus: focusSchema.optional(),
    level: levelSchema.optional(),
  })
  .strict();

const aiCombinationsEnvelopeSchema = z
  .object({
    combinations: z.array(aiCombinationSchema).min(1).max(24),
  })
  .strict();

const aiPlanEnvelopeSchema = z
  .object({
    title: z.string().trim().min(1).max(90),
    focus: focusSchema,
    rounds: z.number().int().min(1).max(20),
    roundSeconds: z.number().int().min(30).max(600),
    restSeconds: z.number().int().min(0).max(180),
    notes: z.string().trim().max(400).default(''),
    combinations: z.array(aiCombinationSchema).min(1).max(24),
  })
  .strict();

export type AiCombinationsEnvelope = z.infer<typeof aiCombinationsEnvelopeSchema>;
export type AiPlanEnvelope = z.infer<typeof aiPlanEnvelopeSchema>;
export type AiCombinationRaw = z.infer<typeof aiCombinationSchema>;

export function parseAiCombinations(raw: unknown): AiCombinationsEnvelope | null {
  const result = aiCombinationsEnvelopeSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseAiPlan(raw: unknown): AiPlanEnvelope | null {
  const result = aiPlanEnvelopeSchema.safeParse(raw);
  return result.success ? result.data : null;
}
