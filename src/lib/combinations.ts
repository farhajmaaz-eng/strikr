import type { Combination, Focus, Stance, WorkoutConfig } from '../../shared/types';
import { LEVEL_RANK } from '../../shared/types';
import {
  TECHNIQUE_BY_ID,
  availableTechniques,
  isTechniqueAvailable,
  techniqueNameById,
} from '../../shared/techniques';
import { CURATED_COMBINATIONS, combinationSignature } from '../../shared/combinations';

export interface Callout {
  combination: Combination;
  display: string;
  spoken: string;
}

export interface CalloutPoolOptions {
  extraCombinations?: Combination[];
  favorites?: string[];
}

export function eligibleCombinations(
  config: Pick<WorkoutConfig, 'discipline' | 'level' | 'enabledTechniques'>,
  extraCombinations: Combination[] = [],
): Combination[] {
  const allowed = new Set(config.enabledTechniques);
  const all = [...CURATED_COMBINATIONS, ...extraCombinations];
  const seen = new Set<string>();
  const result: Combination[] = [];

  for (const combination of all) {
    if (combination.discipline !== config.discipline) continue;
    if (LEVEL_RANK[combination.level] > LEVEL_RANK[config.level]) continue;
    if (!combination.steps.every((step) => allowed.has(step))) continue;
    if (
      !combination.steps.every((step) => {
        const technique = TECHNIQUE_BY_ID.get(step);
        return Boolean(
          technique && isTechniqueAvailable(technique, config.discipline, config.level),
        );
      })
    ) {
      continue;
    }
    const signature = combinationSignature(combination.steps);
    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push(combination);
  }

  return result;
}

export function buildCalloutPool(
  config: WorkoutConfig,
  options: CalloutPoolOptions = {},
): Combination[] {
  const eligible = eligibleCombinations(config, options.extraCombinations);

  const focusMatches = eligible.filter((combination) => combination.focus === config.focus);
  const favorites = new Set(options.favorites ?? []);
  const ranked = [...focusMatches, ...eligible].sort((a, b) => {
    const aFavorite = favorites.has(a.id) ? 1 : 0;
    const bFavorite = favorites.has(b.id) ? 1 : 0;
    return bFavorite - aFavorite;
  });

  const pooled = [...new Set(ranked)];
  if (pooled.length >= 12) return pooled;

  const generated = generateLocalCombinations(
    config,
    Math.max(12 - pooled.length, 8),
    pooled.length,
  );
  return dedupeCombinations([...pooled, ...generated]);
}

export function dedupeCombinations(combinations: Combination[]): Combination[] {
  const seen = new Set<string>();
  return combinations.filter((combination) => {
    const signature = combinationSignature(combination.steps);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export function buildCalloutQueue(
  pool: Combination[],
  count: number,
  random: () => number = Math.random,
): Combination[] {
  if (pool.length === 0 || count <= 0) return [];
  const result: Combination[] = [];
  let bag: Combination[] = [];
  let lastSignature = '';

  while (result.length < count) {
    if (bag.length === 0) {
      bag = shuffle(pool, random);
    }

    let index = bag.findIndex(
      (combination) => combinationSignature(combination.steps) !== lastSignature,
    );
    if (index === -1) index = 0;
    const [next] = bag.splice(index, 1);
    if (!next) break;
    result.push(next);
    lastSignature = combinationSignature(next.steps);
  }

  return result;
}

export function calloutFor(combination: Combination, stance: Stance): Callout {
  const display = combination.steps
    .map((step) => techniqueNameById(step, stance))
    .join(' · ');
  const spoken = combination.steps
    .map((step) => techniqueNameById(step, stance, { speech: true }))
    .join(', ');
  return { combination, display, spoken };
}

export function fallbackCombinations(config: WorkoutConfig, count = 6): Combination[] {
  const pool = buildCalloutPool(config);
  return buildCalloutQueue(pool, count);
}

export function generateLocalCombinations(
  config: WorkoutConfig,
  count: number,
  seed = 0,
): Combination[] {
  const available = availableTechniques(config.discipline, config.level).filter((technique) =>
    config.enabledTechniques.includes(technique.id),
  );
  const byCategory = new Map<string, string[]>();
  for (const technique of available) {
    const list = byCategory.get(technique.category) ?? [];
    list.push(technique.id);
    byCategory.set(technique.category, list);
  }

  const strikes = [
    ...(byCategory.get('punch') ?? []),
    ...(byCategory.get('kick') ?? []),
    ...(byCategory.get('knee') ?? []),
    ...(byCategory.get('elbow') ?? []),
    ...(byCategory.get('clinch') ?? []),
  ];
  const defense = byCategory.get('defense') ?? [];
  const movement = byCategory.get('movement') ?? [];
  const clinch = byCategory.get('clinch') ?? [];

  if (strikes.length === 0) return [];

  const generated: Combination[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = Math.max(40, count * 25);

  while (generated.length < count && attempts < maxAttempts) {
    const cursor = seed + attempts;
    attempts += 1;
    const steps: string[] = [];
    const length = 2 + (cursor % 4);

    if (config.focus === 'defense' && defense.length > 0) {
      steps.push(pick(defense, cursor * 7));
    } else if (config.focus === 'clinch' && clinch.length > 0) {
      steps.push(pick(clinch, cursor * 5));
    } else {
      steps.push(pick(strikes, cursor * 3));
      steps.push(pick(strikes, cursor * 3 + 1));
    }

    while (steps.length < length) {
      const useDefense = defense.length > 0 && (cursor + steps.length) % 5 === 0;
      const useMovement = movement.length > 0 && (cursor + steps.length) % 7 === 0;
      const pool = useDefense ? defense : useMovement ? movement : strikes;
      steps.push(pick(pool, cursor * 11 + steps.length));
    }

    const signature = combinationSignature(steps);
    if (seen.has(signature)) continue;
    seen.add(signature);

    generated.push({
      id: `local-${config.discipline}-${signature}`,
      name: localName(steps, config.stance),
      steps,
      discipline: config.discipline,
      level: config.level,
      focus: config.focus,
      source: 'custom',
    });
  }

  return generated;
}

function localName(steps: string[], stance: Stance): string {
  const first = steps[0];
  const second = steps[1];
  if (!first) return 'Custom flow';
  const firstName = techniqueNameById(first, stance);
  if (!second) return firstName;
  return `${firstName} flow`;
}

function pick<T>(values: T[], index: number): T {
  if (values.length === 0) throw new Error('Cannot pick from an empty list');
  const value = values[Math.abs(index) % values.length];
  if (value === undefined) throw new Error('Missing combination step');
  return value;
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = copy[index]!;
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temp;
  }
  return copy;
}

export function focusMatchesDiscipline(focus: Focus, discipline: WorkoutConfig['discipline']): boolean {
  return focus !== 'clinch' || discipline === 'muay-thai';
}
