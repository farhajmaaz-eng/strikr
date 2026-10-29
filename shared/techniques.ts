import type {
  Discipline,
  SkillLevel,
  Stance,
  Technique,
  TechniqueCategory,
} from './types';
import { LEVEL_RANK } from './types';

export const TECHNIQUES: Technique[] = [
  // Punches
  {
    id: 'jab',
    name: '{lead} jab',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
    number: 1,
  },
  {
    id: 'cross',
    name: '{rear} cross',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
    number: 2,
  },
  {
    id: 'lead-hook',
    name: '{lead} hook',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
    number: 3,
  },
  {
    id: 'rear-hook',
    name: '{rear} hook',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
    number: 4,
  },
  {
    id: 'lead-uppercut',
    name: '{lead} uppercut',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
    number: 5,
  },
  {
    id: 'rear-uppercut',
    name: '{rear} uppercut',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
    number: 6,
  },
  {
    id: 'overhand',
    name: '{rear} overhand',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'body-jab',
    name: '{lead} body jab',
    category: 'punch',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  // Defense
  {
    id: 'slip',
    name: 'slip outside',
    category: 'defense',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'roll',
    name: 'roll under',
    category: 'defense',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'parry',
    name: 'parry {rear}',
    category: 'defense',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'pull',
    name: 'pull back',
    category: 'defense',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'check',
    name: '{lead} check',
    category: 'defense',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'catch-kick',
    name: 'catch {rear} kick',
    category: 'defense',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  // Movement
  {
    id: 'step-off',
    name: 'step off line',
    category: 'movement',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'circle-lead',
    name: 'circle {lead}',
    category: 'movement',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'pivot',
    name: 'pivot {rear}',
    category: 'movement',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'angle-out',
    name: 'angle out',
    category: 'movement',
    disciplines: ['boxing', 'kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  // Kicks
  {
    id: 'lead-round-kick',
    name: '{lead} round kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'rear-round-kick',
    name: '{rear} round kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'lead-body-kick',
    name: '{lead} body kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'rear-leg-kick',
    name: '{rear} leg kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'lead-teep',
    name: '{lead} teep',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'rear-head-kick',
    name: '{rear} head kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'switch-kick',
    name: 'switch kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'side-kick',
    name: '{lead} side kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'spinning-back-kick',
    name: 'spinning back kick',
    category: 'kick',
    disciplines: ['kickboxing', 'muay-thai'],
    minLevel: 'advanced',
  },
  // Knees
  {
    id: 'lead-knee',
    name: '{lead} knee',
    category: 'knee',
    disciplines: ['muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'rear-knee',
    name: '{rear} straight knee',
    category: 'knee',
    disciplines: ['muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'clinch-knee',
    name: 'clinch knee',
    category: 'knee',
    disciplines: ['muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'flying-knee',
    name: 'flying knee',
    category: 'knee',
    disciplines: ['muay-thai'],
    minLevel: 'advanced',
  },
  // Elbows
  {
    id: 'lead-elbow',
    name: '{lead} elbow',
    category: 'elbow',
    disciplines: ['muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'rear-elbow',
    name: '{rear} elbow',
    category: 'elbow',
    disciplines: ['muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'spinning-elbow',
    name: 'spinning elbow',
    category: 'elbow',
    disciplines: ['muay-thai'],
    minLevel: 'advanced',
  },
  // Clinch
  {
    id: 'clinch-entry',
    name: 'clinch entry',
    category: 'clinch',
    disciplines: ['muay-thai'],
    minLevel: 'beginner',
  },
  {
    id: 'clinch-control',
    name: 'clinch control',
    category: 'clinch',
    disciplines: ['muay-thai'],
    minLevel: 'intermediate',
  },
  {
    id: 'clinch-sweep',
    name: 'clinch sweep',
    category: 'clinch',
    disciplines: ['muay-thai'],
    minLevel: 'advanced',
  },
];

export const TECHNIQUE_BY_ID = new Map(TECHNIQUES.map((technique) => [technique.id, technique]));

export function isTechniqueAvailable(
  technique: Technique,
  discipline: Discipline,
  level: SkillLevel,
): boolean {
  return (
    technique.disciplines.includes(discipline) &&
    LEVEL_RANK[technique.minLevel] <= LEVEL_RANK[level]
  );
}

export function availableTechniques(
  discipline: Discipline,
  level: SkillLevel,
): Technique[] {
  return TECHNIQUES.filter((technique) => isTechniqueAvailable(technique, discipline, level));
}

export function techniqueIdsFor(discipline: Discipline, level: SkillLevel): string[] {
  return availableTechniques(discipline, level).map((technique) => technique.id);
}

export function renderTechniqueName(technique: Technique, stance: Stance): string {
  const lead = stance === 'orthodox' ? 'left' : 'right';
  const rear = stance === 'orthodox' ? 'right' : 'left';
  const rendered = technique.name.replaceAll('{lead}', lead).replaceAll('{rear}', rear);
  return rendered.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function techniqueNameById(
  id: string,
  stance: Stance,
  { speech = false }: { speech?: boolean } = {},
): string {
  const technique = TECHNIQUE_BY_ID.get(id);
  if (!technique) return id;
  const rendered = renderTechniqueName(technique, stance);
  return speech ? rendered.toLowerCase() : rendered;
}

export function techniqueCategory(id: string): TechniqueCategory | undefined {
  return TECHNIQUE_BY_ID.get(id)?.category;
}
