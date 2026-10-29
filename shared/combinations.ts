import type { Combination, Discipline, Focus, SkillLevel } from './types';
import { techniqueNameById } from './techniques';

function combo(
  id: string,
  name: string,
  discipline: Discipline,
  level: SkillLevel,
  focus: Focus,
  steps: string[],
): Combination {
  return {
    id,
    name,
    discipline,
    level,
    focus,
    steps,
    source: 'curated',
  };
}

export const CURATED_COMBINATIONS: Combination[] = [
  // Boxing
  combo('box-opener', 'The Opener', 'boxing', 'beginner', 'fundamentals', ['jab', 'cross']),
  combo('box-double-tap', 'Double Tap', 'boxing', 'beginner', 'speed', ['jab', 'jab', 'cross']),
  combo('box-one-two-three', 'One-Two-Three', 'boxing', 'beginner', 'fundamentals', [
    'jab',
    'cross',
    'lead-hook',
  ]),
  combo('box-cross-fire', 'Cross Fire', 'boxing', 'beginner', 'power', [
    'cross',
    'lead-hook',
    'cross',
  ]),
  combo('box-ladder', 'The Ladder', 'boxing', 'beginner', 'power', [
    'jab',
    'cross',
    'lead-uppercut',
    'cross',
  ]),
  combo('box-rapid-fire', 'Rapid Fire', 'boxing', 'intermediate', 'speed', [
    'jab',
    'cross',
    'lead-hook',
    'cross',
  ]),
  combo('box-slip-counter', 'Slip Counter', 'boxing', 'beginner', 'defense', [
    'slip',
    'cross',
    'lead-hook',
  ]),
  combo('box-roll-out', 'Roll Out', 'boxing', 'beginner', 'defense', [
    'jab',
    'cross',
    'roll',
    'cross',
  ]),
  combo('box-body-hunt', 'Body Hunt', 'boxing', 'beginner', 'fundamentals', [
    'body-jab',
    'cross',
    'lead-hook',
  ]),
  combo('box-exit-angle', 'Exit Angle', 'boxing', 'beginner', 'defense', [
    'jab',
    'cross',
    'step-off',
  ]),
  combo('box-upstairs-downstairs', 'Upstairs, Downstairs', 'boxing', 'intermediate', 'power', [
    'cross',
    'lead-hook',
    'rear-uppercut',
  ]),
  combo('box-five-piece', 'Five Piece', 'boxing', 'intermediate', 'speed', [
    'jab',
    'cross',
    'lead-hook',
    'cross',
    'lead-uppercut',
  ]),
  combo('box-parry-counter', 'Parry Counter', 'boxing', 'beginner', 'defense', [
    'parry',
    'cross',
    'lead-hook',
  ]),
  combo('box-pivot-shot', 'Pivot Shot', 'boxing', 'intermediate', 'defense', [
    'jab',
    'cross',
    'pivot',
    'lead-hook',
  ]),
  combo('box-six-shooter', 'Six Shooter', 'boxing', 'intermediate', 'conditioning', [
    'jab',
    'cross',
    'lead-hook',
    'cross',
    'lead-hook',
    'cross',
  ]),
  combo('box-overhand-entry', 'Overhand Entry', 'boxing', 'intermediate', 'power', [
    'jab',
    'overhand',
    'lead-hook',
  ]),

  // Kickboxing
  combo('kb-basic-kick', 'Basic Kick', 'kickboxing', 'beginner', 'fundamentals', [
    'jab',
    'cross',
    'rear-leg-kick',
  ]),
  combo('kb-power-kick', 'Power Kick', 'kickboxing', 'beginner', 'power', [
    'jab',
    'cross',
    'rear-round-kick',
  ]),
  combo('kb-body-kick', 'Body Kick', 'kickboxing', 'beginner', 'fundamentals', [
    'jab',
    'cross',
    'lead-body-kick',
  ]),
  combo('kb-teep-cross', 'Teep Cross', 'kickboxing', 'beginner', 'fundamentals', [
    'lead-teep',
    'cross',
    'lead-hook',
  ]),
  combo('kb-teep-exit', 'Teep Exit', 'kickboxing', 'beginner', 'conditioning', [
    'jab',
    'cross',
    'lead-teep',
  ]),
  combo('kb-hook-kick', 'Hook Kick', 'kickboxing', 'beginner', 'power', [
    'lead-hook',
    'cross',
    'rear-leg-kick',
  ]),
  combo('kb-switch-kick', 'Switch Kick', 'kickboxing', 'intermediate', 'power', [
    'jab',
    'cross',
    'switch-kick',
  ]),
  combo('kb-head-hunter', 'Head Hunter', 'kickboxing', 'intermediate', 'power', [
    'jab',
    'cross',
    'rear-head-kick',
  ]),
  combo('kb-check-counter', 'Check Counter', 'kickboxing', 'intermediate', 'defense', [
    'jab',
    'cross',
    'check',
    'cross',
  ]),
  combo('kb-angle-kick', 'Angle Kick', 'kickboxing', 'intermediate', 'defense', [
    'jab',
    'cross',
    'angle-out',
    'rear-round-kick',
  ]),
  combo('kb-cross-head-kick', 'Cross Head Kick', 'kickboxing', 'intermediate', 'power', [
    'cross',
    'lead-hook',
    'rear-head-kick',
  ]),
  combo('kb-pivot-kick', 'Pivot Kick', 'kickboxing', 'intermediate', 'defense', [
    'jab',
    'cross',
    'pivot',
    'rear-round-kick',
  ]),
  combo('kb-body-head', 'Body Head', 'kickboxing', 'advanced', 'power', [
    'jab',
    'cross',
    'lead-body-kick',
    'rear-head-kick',
  ]),
  combo('kb-leg-cross', 'Leg Cross', 'kickboxing', 'beginner', 'power', [
    'rear-leg-kick',
    'cross',
    'lead-hook',
  ]),
  combo('kb-side-kick', 'Side Kick', 'kickboxing', 'intermediate', 'defense', [
    'jab',
    'cross',
    'lead-side-kick',
  ]),
  combo('kb-spin-finish', 'Spin Finish', 'kickboxing', 'advanced', 'power', [
    'cross',
    'spinning-back-kick',
  ]),
  combo('kb-catch-and-go', 'Catch And Go', 'kickboxing', 'intermediate', 'defense', [
    'jab',
    'cross',
    'catch-kick',
    'cross',
  ]),
  combo('kb-three-kick', 'Three Kick', 'kickboxing', 'beginner', 'conditioning', [
    'jab',
    'cross',
    'lead-body-kick',
    'rear-round-kick',
  ]),

  // Muay Thai
  combo('mt-basic-leg', 'Basic Leg', 'muay-thai', 'beginner', 'fundamentals', [
    'jab',
    'cross',
    'rear-leg-kick',
  ]),
  combo('mt-straight-knee', 'Straight Knee', 'muay-thai', 'beginner', 'fundamentals', [
    'jab',
    'cross',
    'rear-knee',
  ]),
  combo('mt-teep-elbow', 'Teep Elbow', 'muay-thai', 'intermediate', 'power', [
    'lead-teep',
    'cross',
    'rear-elbow',
  ]),
  combo('mt-elbow-entry', 'Elbow Entry', 'muay-thai', 'intermediate', 'power', [
    'jab',
    'cross',
    'rear-elbow',
  ]),
  combo('mt-clinch-close', 'Clinch Close', 'muay-thai', 'intermediate', 'clinch', [
    'clinch-entry',
    'clinch-knee',
    'rear-elbow',
  ]),
  combo('mt-clinch-approach', 'Clinch Approach', 'muay-thai', 'intermediate', 'clinch', [
    'jab',
    'cross',
    'clinch-entry',
    'clinch-knee',
  ]),
  combo('mt-check-knee', 'Check Knee', 'muay-thai', 'intermediate', 'defense', [
    'jab',
    'cross',
    'check',
    'rear-knee',
  ]),
  combo('mt-slip-leg', 'Slip Leg', 'muay-thai', 'beginner', 'defense', [
    'slip',
    'cross',
    'rear-leg-kick',
  ]),
  combo('mt-knee-elbow', 'Knee Elbow', 'muay-thai', 'beginner', 'fundamentals', [
    'lead-knee',
    'rear-elbow',
    'clinch-entry',
  ]),
  combo('mt-three-piece-knee', 'Three Piece Knee', 'muay-thai', 'beginner', 'fundamentals', [
    'jab',
    'cross',
    'lead-hook',
    'rear-knee',
  ]),
  combo('mt-switch-knee', 'Switch Knee', 'muay-thai', 'intermediate', 'power', [
    'switch-kick',
    'rear-knee',
  ]),
  combo('mt-teep-drill', 'Teep Drill', 'muay-thai', 'beginner', 'conditioning', [
    'jab',
    'cross',
    'lead-teep',
  ]),
  combo('mt-sweep', 'Sweep', 'muay-thai', 'advanced', 'clinch', [
    'clinch-entry',
    'clinch-control',
    'clinch-sweep',
  ]),
  combo('mt-flying-knee', 'Flying Knee', 'muay-thai', 'advanced', 'power', [
    'step-off',
    'flying-knee',
  ]),
  combo('mt-low-high', 'Low High', 'muay-thai', 'intermediate', 'power', [
    'rear-leg-kick',
    'rear-head-kick',
  ]),
  combo('mt-spin-elbow', 'Spin Elbow', 'muay-thai', 'advanced', 'power', [
    'step-off',
    'spinning-elbow',
  ]),
  combo('mt-body-clinch', 'Body Clinch', 'muay-thai', 'intermediate', 'clinch', [
    'jab',
    'cross',
    'lead-body-kick',
    'clinch-entry',
    'clinch-knee',
  ]),
  combo('mt-check-sweep', 'Check Sweep', 'muay-thai', 'advanced', 'defense', [
    'jab',
    'cross',
    'check',
    'clinch-sweep',
  ]),
  combo('mt-teep-clinch', 'Teep Clinch', 'muay-thai', 'intermediate', 'clinch', [
    'lead-teep',
    'clinch-entry',
    'clinch-knee',
    'rear-elbow',
  ]),
  combo('mt-rhythm', 'Rhythm', 'muay-thai', 'advanced', 'speed', [
    'jab',
    'cross',
    'lead-hook',
    'cross',
  ]),
];

export function combinationSignature(steps: readonly string[]): string {
  return steps.join('>');
}

export function renderCombinationSteps(
  steps: readonly string[],
  stance: 'orthodox' | 'southpaw',
  { speech = false }: { speech?: boolean } = {},
): string {
  return steps
    .map((step) => techniqueNameById(step, stance, { speech }))
    .join(speech ? ', ' : ' · ');
}

export function combinationTitle(combination: Combination, stance: 'orthodox' | 'southpaw'): string {
  return combination.name || renderCombinationSteps(combination.steps, stance);
}
