import { describe, expect, it } from 'vitest';
import type { WorkoutConfig } from '../shared/types';
import { combinationSignature, renderCombinationSteps } from '../shared/combinations';
import { renderTechniqueName, TECHNIQUE_BY_ID } from '../shared/techniques';
import {
  buildCalloutPool,
  buildCalloutQueue,
  generateLocalCombinations,
} from '../src/lib/combinations';

const config: WorkoutConfig = {
  discipline: 'boxing',
  stance: 'orthodox',
  level: 'beginner',
  rounds: 6,
  roundSeconds: 180,
  restSeconds: 60,
  focus: 'fundamentals',
  enabledTechniques: ['jab', 'cross', 'lead-hook', 'slip', 'step-off'],
  countInSeconds: 10,
};

describe('combination generation', () => {
  it('builds a pool that only uses enabled, available techniques', () => {
    const pool = buildCalloutPool(config);
    const enabled = new Set(config.enabledTechniques);
    expect(pool.length).toBeGreaterThanOrEqual(8);
    for (const combination of pool) {
      expect(combination.steps.every((step) => enabled.has(step))).toBe(true);
      expect(combination.discipline).toBe('boxing');
    }
  });

  it('never places the same sequence back-to-back in a callout queue', () => {
    const pool = buildCalloutPool(config);
    const queue = buildCalloutQueue(pool, 60, () => 0.42);
    expect(queue).toHaveLength(60);
    for (let index = 1; index < queue.length; index += 1) {
      expect(combinationSignature(queue[index]!.steps)).not.toBe(
        combinationSignature(queue[index - 1]!.steps),
      );
    }
  });

  it('generates local variations even when no curated combo fits the scope', () => {
    const narrow: WorkoutConfig = {
      ...config,
      enabledTechniques: ['jab', 'cross'],
    };
    const generated = generateLocalCombinations(narrow, 6);
    expect(generated.length).toBeGreaterThan(0);
    for (const combination of generated) {
      expect(combination.steps.every((step) => ['jab', 'cross'].includes(step))).toBe(true);
    }
  });

  it('renders stance-aware technique names and callout text', () => {
    const jab = TECHNIQUE_BY_ID.get('jab')!;
    const cross = TECHNIQUE_BY_ID.get('cross')!;
    expect(renderTechniqueName(jab, 'orthodox')).toBe('Left Jab');
    expect(renderTechniqueName(jab, 'southpaw')).toBe('Right Jab');
    expect(renderTechniqueName(cross, 'southpaw')).toBe('Left Cross');
    expect(renderCombinationSteps(['jab', 'cross'], 'southpaw', { speech: true })).toBe(
      'right jab, left cross',
    );
  });

  it('protects against duplicate signatures in curated library pools', () => {
    const pool = buildCalloutPool(config);
    const signatures = pool.map((combination) => combinationSignature(combination.steps));
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});
