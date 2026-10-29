import { describe, expect, it } from 'vitest';
import type { AiGenerationRequest } from '../shared/types';
import { resolveAllowedTechniques, validateCombinations, validatePlan } from '../server/validate';
import { parseAiCombinations, parseAiPlan } from '../shared/schemas';

const boxingRequest: AiGenerationRequest = {
  mode: 'combinations',
  discipline: 'boxing',
  stance: 'orthodox',
  level: 'beginner',
  focus: 'fundamentals',
  count: 4,
  allowedTechniques: ['jab', 'cross', 'lead-hook', 'slip', 'rear-knee'],
};

const boxingContext = () => {
  const { allowed } = resolveAllowedTechniques(boxingRequest);
  return {
    discipline: boxingRequest.discipline,
    level: boxingRequest.level,
    stance: boxingRequest.stance,
    focus: boxingRequest.focus,
    allowedTechniques: allowed,
  };
};

describe('technique scope validation', () => {
  it('drops techniques that are not available for the discipline', () => {
    const { allowed, invalid } = resolveAllowedTechniques(boxingRequest);
    expect(invalid).toEqual(['rear-knee']);
    expect(allowed.has('jab')).toBe(true);
    expect(allowed.has('rear-knee')).toBe(false);
  });

  it('rejects an entire combination when one step is outside the scope', () => {
    const result = validateCombinations(
      [
        { name: 'Clean', steps: ['jab', 'cross'] },
        { name: 'Kick slipped in', steps: ['jab', 'rear-knee'] },
        { name: 'Invented', steps: ['jab', 'mystery-strike'] },
      ],
      boxingContext(),
    );
    expect(result.combinations).toHaveLength(1);
    expect(result.combinations[0]?.name).toBe('Clean');
    expect(result.rejected).toBe(2);
  });

  it('deduplicates identical sequences and rejects impossible levels', () => {
    const result = validateCombinations(
      [
        { name: 'One', steps: ['jab', 'cross'], level: 'beginner' },
        { name: 'Duplicate', steps: ['jab', 'cross'], level: 'beginner' },
        { name: 'Too advanced', steps: ['lead-hook', 'cross'], level: 'advanced' },
      ],
      boxingContext(),
    );
    expect(result.combinations).toHaveLength(1);
    expect(result.rejected).toBe(2);
  });

  it('strictly parses AI envelopes and rejects unknown top-level fields', () => {
    expect(
      parseAiCombinations({
        combinations: [{ name: 'One two', steps: ['jab', 'cross'] }],
      }),
    ).not.toBeNull();
    expect(
      parseAiCombinations({
        combinations: [{ name: 'One two', steps: ['jab', 'cross'] }],
        extra: true,
      }),
    ).toBeNull();
    expect(parseAiCombinations({ combinations: [] })).toBeNull();
  });

  it('validates a generated plan and filters bad combinations', () => {
    const context = boxingContext();
    const valid = validatePlan(
      {
        title: 'Sharp session',
        focus: 'fundamentals',
        rounds: 6,
        roundSeconds: 180,
        restSeconds: 60,
        notes: 'Stay long.',
        combinations: [
          { name: 'One two', steps: ['jab', 'cross'] },
          { name: 'Kick?', steps: ['jab', 'rear-knee'] },
        ],
      },
      context,
    );
    expect(valid).toBeNull();

    const mixed = validatePlan(
      {
        title: 'Sharp session',
        focus: 'fundamentals',
        rounds: 6,
        roundSeconds: 180,
        restSeconds: 60,
        notes: 'Stay long.',
        combinations: [
          { name: 'One two', steps: ['jab', 'cross'] },
          { name: 'Three', steps: ['jab', 'cross', 'lead-hook'] },
        ],
      },
      context,
    );
    expect(mixed?.plan.combinations).toHaveLength(2);
    expect(mixed?.rejected).toBe(0);
  });

  it('rejects malformed plan JSON', () => {
    expect(
      parseAiPlan({
        title: 'Bad',
        focus: 'fundamentals',
        rounds: 0,
        roundSeconds: 20,
        restSeconds: 999,
        notes: '',
        combinations: [],
      }),
    ).toBeNull();
  });
});
