import type { Combination, WorkoutConfig } from '../../shared/types';
import { buildCalloutPool, buildCalloutQueue } from './combinations';
import { createId } from './id';

export type WorkoutSource = 'setup' | 'quick' | 'ai';

export interface WorkoutRun {
  runId: string;
  config: WorkoutConfig;
  callouts: Combination[];
  source: WorkoutSource;
  title?: string;
}

export interface WorkoutLaunchOptions {
  extraCombinations?: Combination[];
  callouts?: Combination[];
  favorites?: string[];
  source?: WorkoutSource;
  title?: string;
}

export function createWorkoutRun(
  config: WorkoutConfig,
  options: WorkoutLaunchOptions,
  calloutIntervalSeconds: number,
): WorkoutRun {
  const perRound = Math.ceil(config.roundSeconds / Math.max(5, calloutIntervalSeconds)) + 2;
  const calloutCount = Math.max(10, config.rounds * perRound);
  const pool = buildCalloutPool(config, {
    extraCombinations: options.extraCombinations,
    favorites: options.favorites,
  });
  const callouts = buildCalloutQueue(options.callouts?.length ? options.callouts : pool, calloutCount);

  return {
    runId: createId('run'),
    config,
    callouts,
    source: options.source ?? 'setup',
    title: options.title,
  };
}

export const ACTIVE_WORKOUT_KEY = 'strikr.active-workout.v1';

export function readSavedWorkout(): WorkoutRun | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'runId' in parsed &&
      'config' in parsed &&
      'callouts' in parsed &&
      Array.isArray((parsed as WorkoutRun).callouts)
    ) {
      return parsed as WorkoutRun;
    }
  } catch {
    return null;
  }
  return null;
}

export function persistWorkout(run: WorkoutRun): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(run));
  } catch {
    // The in-memory run still works if session storage is unavailable.
  }
}

export function removeSavedWorkout(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ACTIVE_WORKOUT_KEY);
  } catch {
    // Ignore.
  }
}
