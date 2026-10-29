import type { Combination, CompletedSession, UserSettings } from '../../shared/types';
import {
  DEFAULT_SETTINGS,
  DISCIPLINES,
  FOCUSES,
  LEVELS,
  STANCES,
} from '../../shared/types';

export const STORAGE_KEYS = {
  settings: 'strikr.settings.v1',
  customCombinations: 'strikr.combinations.v1',
  favorites: 'strikr.favorites.v1',
  sessions: 'strikr.sessions.v1',
} as const;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements KeyValueStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const memoryStorage = new MemoryStorage();

export function browserStorage(): KeyValueStorage {
  if (typeof window !== 'undefined') {
    try {
      const testKey = '__strikr_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch {
      return memoryStorage;
    }
  }
  return memoryStorage;
}

export function loadSettings(storage: KeyValueStorage = browserStorage()): UserSettings {
  const raw = readJson(storage, STORAGE_KEYS.settings);
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS };
  return sanitizeSettings(raw as Record<string, unknown>);
}

export function saveSettings(
  settings: UserSettings,
  storage: KeyValueStorage = browserStorage(),
): void {
  writeJson(storage, STORAGE_KEYS.settings, sanitizeSettings(settings as unknown as Record<string, unknown>));
}

export function loadCustomCombinations(
  storage: KeyValueStorage = browserStorage(),
): Combination[] {
  const raw = readJson(storage, STORAGE_KEYS.customCombinations);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCombination).slice(0, 200);
}

export function saveCustomCombinations(
  combinations: Combination[],
  storage: KeyValueStorage = browserStorage(),
): void {
  writeJson(storage, STORAGE_KEYS.customCombinations, combinations.slice(0, 200));
}

export function loadFavorites(storage: KeyValueStorage = browserStorage()): string[] {
  const raw = readJson(storage, STORAGE_KEYS.favorites);
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value): value is string => typeof value === 'string'))].slice(
    0,
    500,
  );
}

export function saveFavorites(ids: string[], storage: KeyValueStorage = browserStorage()): void {
  writeJson(storage, STORAGE_KEYS.favorites, [...new Set(ids)].slice(0, 500));
}

export function loadSessions(storage: KeyValueStorage = browserStorage()): CompletedSession[] {
  const raw = readJson(storage, STORAGE_KEYS.sessions);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isSession)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, 100);
}

export function saveSessions(
  sessions: CompletedSession[],
  storage: KeyValueStorage = browserStorage(),
): void {
  const newestFirst = [...sessions].sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
  );
  writeJson(storage, STORAGE_KEYS.sessions, newestFirst.slice(0, 100));
}

export function clearSessions(storage: KeyValueStorage = browserStorage()): void {
  storage.removeItem(STORAGE_KEYS.sessions);
}

function readJson(storage: KeyValueStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: KeyValueStorage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked. The app remains usable for the session.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function sanitizeSettings(raw: Record<string, unknown>): UserSettings {
  return {
    speechEnabled:
      typeof raw.speechEnabled === 'boolean' ? raw.speechEnabled : DEFAULT_SETTINGS.speechEnabled,
    soundEnabled:
      typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    speechRate: roundTo(clampNumber(raw.speechRate, DEFAULT_SETTINGS.speechRate, 0.6, 1.4), 2),
    voiceURI: typeof raw.voiceURI === 'string' && raw.voiceURI.length < 300 ? raw.voiceURI : null,
    bellVolume: roundTo(clampNumber(raw.bellVolume, DEFAULT_SETTINGS.bellVolume, 0, 1), 2),
    wakeLockEnabled:
      typeof raw.wakeLockEnabled === 'boolean'
        ? raw.wakeLockEnabled
        : DEFAULT_SETTINGS.wakeLockEnabled,
    calloutIntervalSeconds: Math.round(
      clampNumber(
        raw.calloutIntervalSeconds,
        DEFAULT_SETTINGS.calloutIntervalSeconds,
        5,
        30,
      ),
    ),
    defaultDiscipline: isOneOf(raw.defaultDiscipline, DISCIPLINES)
      ? raw.defaultDiscipline
      : DEFAULT_SETTINGS.defaultDiscipline,
    defaultStance: isOneOf(raw.defaultStance, STANCES)
      ? raw.defaultStance
      : DEFAULT_SETTINGS.defaultStance,
    defaultLevel: isOneOf(raw.defaultLevel, LEVELS)
      ? raw.defaultLevel
      : DEFAULT_SETTINGS.defaultLevel,
    defaultRounds: Math.round(
      clampNumber(raw.defaultRounds, DEFAULT_SETTINGS.defaultRounds, 1, 20),
    ),
    defaultRoundSeconds: Math.round(
      clampNumber(raw.defaultRoundSeconds, DEFAULT_SETTINGS.defaultRoundSeconds, 30, 600),
    ),
    defaultRestSeconds: Math.round(
      clampNumber(raw.defaultRestSeconds, DEFAULT_SETTINGS.defaultRestSeconds, 0, 180),
    ),
    defaultFocus: isOneOf(raw.defaultFocus, FOCUSES)
      ? raw.defaultFocus
      : DEFAULT_SETTINGS.defaultFocus,
    defaultCountInSeconds: Math.round(
      clampNumber(raw.defaultCountInSeconds, DEFAULT_SETTINGS.defaultCountInSeconds, 0, 15),
    ),
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function isCombination(value: unknown): value is Combination {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.steps) &&
    value.steps.length >= 2 &&
    value.steps.length <= 8 &&
    value.steps.every((step) => typeof step === 'string') &&
    isOneOf(value.discipline, DISCIPLINES) &&
    isOneOf(value.level, LEVELS) &&
    isOneOf(value.focus, FOCUSES) &&
    (value.source === 'curated' || value.source === 'custom' || value.source === 'ai')
  );
}

function isSession(value: unknown): value is CompletedSession {
  if (!isRecord(value)) return false;
  const combosValid =
    Array.isArray(value.combinations) &&
    value.combinations.every(
      (combo) =>
        isRecord(combo) &&
        typeof combo.name === 'string' &&
        Array.isArray(combo.steps) &&
        combo.steps.every((step) => typeof step === 'string'),
    );

  return (
    typeof value.id === 'string' &&
    typeof value.completedAt === 'string' &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    isOneOf(value.discipline, DISCIPLINES) &&
    isOneOf(value.stance, STANCES) &&
    isOneOf(value.level, LEVELS) &&
    isOneOf(value.focus, FOCUSES) &&
    typeof value.roundsPlanned === 'number' &&
    typeof value.roundsCompleted === 'number' &&
    Array.isArray(value.skippedRounds) &&
    typeof value.roundSeconds === 'number' &&
    typeof value.restSeconds === 'number' &&
    typeof value.trainingSeconds === 'number' &&
    typeof value.endedEarly === 'boolean' &&
    combosValid
  );
}
