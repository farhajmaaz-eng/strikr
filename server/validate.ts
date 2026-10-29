import type {
  AiCombination,
  AiGenerationRequest,
  AiPlan,
  Discipline,
  Focus,
  SkillLevel,
  Stance,
} from '../shared/types';
import { LEVEL_RANK } from '../shared/types';
import { TECHNIQUE_BY_ID, isTechniqueAvailable, renderTechniqueName } from '../shared/techniques';
import type { AiCombinationRaw } from '../shared/schemas';
import { combinationSignature } from '../shared/combinations';

export interface ValidationContext {
  discipline: Discipline;
  level: SkillLevel;
  stance: Stance;
  focus: Focus;
  allowedTechniques: Set<string>;
  existingSignatures?: Set<string>;
}

export interface ValidatedCombinations {
  combinations: AiCombination[];
  rejected: number;
}

/**
 * Keeps only structurally valid combinations that use known, permitted
 * techniques. A combination is rejected whole if any step is disallowed.
 */
export function validateCombinations(
  raw: AiCombinationRaw[],
  context: ValidationContext,
): ValidatedCombinations {
  const combinations: AiCombination[] = [];
  const seen = new Set<string>(context.existingSignatures ?? []);
  let rejected = 0;

  for (const candidate of raw) {
    const steps = candidate.steps;

    const valid = steps.every((step) => {
      if (!context.allowedTechniques.has(step)) return false;
      const technique = TECHNIQUE_BY_ID.get(step);
      if (!technique) return false;
      return isTechniqueAvailable(technique, context.discipline, context.level);
    });

    const signature = combinationSignature(steps);
    const level = candidate.level ?? context.level;
    const levelValid = LEVEL_RANK[level] <= LEVEL_RANK[context.level];

    if (!valid || !levelValid || seen.has(signature)) {
      rejected += 1;
      continue;
    }

    seen.add(signature);
    combinations.push({
      name: sanitizeName(candidate.name, steps, context.stance),
      steps: [...steps],
      focus: candidate.focus ?? context.focus,
      level: candidate.level ?? context.level,
    });
  }

  return { combinations, rejected };
}

export function validatePlan(
  raw: {
    title: string;
    focus: Focus;
    rounds: number;
    roundSeconds: number;
    restSeconds: number;
    notes: string;
    combinations: AiCombinationRaw[];
  },
  context: ValidationContext,
): { plan: AiPlan; rejected: number } | null {
  const { combinations, rejected } = validateCombinations(raw.combinations, context);
  if (combinations.length < 2) return null;

  return {
    plan: {
      title: sanitizeText(raw.title, 90) || 'Generated session',
      focus: raw.focus,
      rounds: raw.rounds,
      roundSeconds: raw.roundSeconds,
      restSeconds: raw.restSeconds,
      notes: sanitizeText(raw.notes, 400),
      combinations,
    },
    rejected,
  };
}

export function resolveAllowedTechniques(request: AiGenerationRequest): {
  allowed: Set<string>;
  invalid: string[];
} {
  const allowed = new Set<string>();
  const invalid: string[] = [];

  for (const id of new Set(request.allowedTechniques)) {
    const technique = TECHNIQUE_BY_ID.get(id);
    if (!technique || !isTechniqueAvailable(technique, request.discipline, request.level)) {
      invalid.push(id);
      continue;
    }
    allowed.add(id);
  }

  return { allowed, invalid };
}

function sanitizeName(name: string, steps: string[], stance: Stance): string {
  const clean = sanitizeText(name, 70);
  if (clean) return clean;
  return steps
    .slice(0, 3)
    .map((step) => {
      const technique = TECHNIQUE_BY_ID.get(step);
      return technique ? renderTechniqueName(technique, stance) : step;
    })
    .join(' · ');
}

export function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(/\p{Cc}/gu, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
