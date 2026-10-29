export const DISCIPLINES = ['boxing', 'kickboxing', 'muay-thai'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  boxing: 'Boxing',
  kickboxing: 'Kickboxing',
  'muay-thai': 'Muay Thai',
};

export const STANCES = ['orthodox', 'southpaw'] as const;
export type Stance = (typeof STANCES)[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof LEVELS)[number];

export const FOCUSES = [
  'fundamentals',
  'power',
  'speed',
  'defense',
  'conditioning',
  'clinch',
] as const;
export type Focus = (typeof FOCUSES)[number];

export const FOCUS_LABELS: Record<Focus, string> = {
  fundamentals: 'Fundamentals',
  power: 'Power',
  speed: 'Speed',
  defense: 'Defense',
  conditioning: 'Conditioning',
  clinch: 'Clinch',
};

export const TECHNIQUE_CATEGORIES = [
  'punch',
  'kick',
  'knee',
  'elbow',
  'defense',
  'movement',
  'clinch',
] as const;
export type TechniqueCategory = (typeof TECHNIQUE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<TechniqueCategory, string> = {
  punch: 'Punches',
  kick: 'Kicks',
  knee: 'Knees',
  elbow: 'Elbows',
  defense: 'Defense',
  movement: 'Movement',
  clinch: 'Clinch',
};

export interface Technique {
  id: string;
  /** `{lead}` and `{rear}` resolve from the fighter's stance. */
  name: string;
  category: TechniqueCategory;
  disciplines: Discipline[];
  minLevel: SkillLevel;
  /** Traditional boxing number, when one exists. */
  number?: number;
}

export type CombinationSource = 'curated' | 'custom' | 'ai';

export interface Combination {
  id: string;
  name: string;
  steps: string[];
  discipline: Discipline;
  level: SkillLevel;
  focus: Focus;
  source: CombinationSource;
  createdAt?: string;
}

export interface WorkoutConfig {
  discipline: Discipline;
  stance: Stance;
  level: SkillLevel;
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
  focus: Focus;
  enabledTechniques: string[];
  countInSeconds: number;
}

export interface SessionCombination {
  name: string;
  steps: string[];
}

export interface CompletedSession {
  id: string;
  completedAt: string;
  discipline: Discipline;
  stance: Stance;
  level: SkillLevel;
  focus: Focus;
  roundsPlanned: number;
  roundsCompleted: number;
  skippedRounds: number[];
  roundSeconds: number;
  restSeconds: number;
  trainingSeconds: number;
  endedEarly: boolean;
  combinations: SessionCombination[];
}

export interface UserSettings {
  speechEnabled: boolean;
  soundEnabled: boolean;
  speechRate: number;
  voiceURI: string | null;
  bellVolume: number;
  wakeLockEnabled: boolean;
  calloutIntervalSeconds: number;
  defaultDiscipline: Discipline;
  defaultStance: Stance;
  defaultLevel: SkillLevel;
  defaultRounds: number;
  defaultRoundSeconds: number;
  defaultRestSeconds: number;
  defaultFocus: Focus;
  defaultCountInSeconds: number;
}

export interface AiPlanSettings {
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
}

export interface AiGenerationRequest {
  mode: 'combinations' | 'plan';
  discipline: Discipline;
  stance: Stance;
  level: SkillLevel;
  focus: Focus;
  count: number;
  allowedTechniques: string[];
  planSettings?: AiPlanSettings;
}

export interface AiCombination {
  name: string;
  steps: string[];
  focus?: Focus;
  level?: SkillLevel;
}

export interface AiPlan {
  title: string;
  focus: Focus;
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
  notes: string;
  combinations: AiCombination[];
}

export type AiGenerationResponse =
  | {
      ok: true;
      mode: 'combinations';
      combinations: AiCombination[];
      rejected: number;
    }
  | {
      ok: true;
      mode: 'plan';
      plan: AiPlan;
      rejected: number;
    }
  | {
      ok: false;
      error: { code: string; message: string };
      fallback: 'curated';
    };

export const DEFAULT_SETTINGS: UserSettings = {
  speechEnabled: true,
  soundEnabled: true,
  speechRate: 0.95,
  voiceURI: null,
  bellVolume: 0.75,
  wakeLockEnabled: true,
  calloutIntervalSeconds: 10,
  defaultDiscipline: 'boxing',
  defaultStance: 'orthodox',
  defaultLevel: 'beginner',
  defaultRounds: 6,
  defaultRoundSeconds: 180,
  defaultRestSeconds: 60,
  defaultFocus: 'fundamentals',
  defaultCountInSeconds: 10,
};

export const LEVEL_RANK: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};
