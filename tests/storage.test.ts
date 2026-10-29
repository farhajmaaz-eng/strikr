import { describe, expect, it } from 'vitest';
import type { Combination, CompletedSession, UserSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import {
  STORAGE_KEYS,
  clearSessions,
  loadCustomCombinations,
  loadFavorites,
  loadSessions,
  loadSettings,
  saveCustomCombinations,
  saveFavorites,
  saveSessions,
  saveSettings,
  type KeyValueStorage,
} from '../src/lib/storage';

class TestStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function session(index: number): CompletedSession {
  return {
    id: `session-${index}`,
    completedAt: new Date(2026, 0, 1, 12, 0, index).toISOString(),
    discipline: 'boxing',
    stance: 'orthodox',
    level: 'beginner',
    focus: 'fundamentals',
    roundsPlanned: 6,
    roundsCompleted: 5,
    skippedRounds: [6],
    roundSeconds: 180,
    restSeconds: 60,
    trainingSeconds: 900,
    endedEarly: true,
    combinations: [{ name: 'One two', steps: ['jab', 'cross'] }],
  };
}

const customCombo: Combination = {
  id: 'custom-1',
  name: 'Custom one two',
  steps: ['jab', 'cross'],
  discipline: 'boxing',
  level: 'beginner',
  focus: 'fundamentals',
  source: 'custom',
};

describe('local persistence', () => {
  it('round-trips settings and fills missing values with defaults', () => {
    const storage = new TestStorage();
    const settings: UserSettings = {
      ...DEFAULT_SETTINGS,
      speechEnabled: false,
      speechRate: 1.15,
      defaultRounds: 9,
      defaultDiscipline: 'muay-thai',
    };
    saveSettings(settings, storage);
    expect(loadSettings(storage)).toMatchObject({
      speechEnabled: false,
      speechRate: 1.15,
      defaultRounds: 9,
      defaultDiscipline: 'muay-thai',
    });

    storage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ speechRate: 99, defaultRounds: 300, defaultDiscipline: 'karate' }),
    );
    const sanitized = loadSettings(storage);
    expect(sanitized.speechRate).toBe(1.4);
    expect(sanitized.defaultRounds).toBe(20);
    expect(sanitized.defaultDiscipline).toBe('boxing');
    expect(sanitized.speechEnabled).toBe(true);
  });

  it('falls back to defaults when stored settings are corrupt', () => {
    const storage = new TestStorage();
    storage.setItem(STORAGE_KEYS.settings, '{not-json');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('persists custom combinations, favorites, and drops invalid records', () => {
    const storage = new TestStorage();
    saveCustomCombinations(
      [customCombo, { ...customCombo, id: 'bad', steps: ['one'] } as unknown as Combination],
      storage,
    );
    expect(loadCustomCombinations(storage)).toEqual([customCombo]);

    saveFavorites(['a', 'a', 'b'], storage);
    expect(loadFavorites(storage)).toEqual(['a', 'b']);
  });

  it('sorts sessions newest first, caps history, and clears it', () => {
    const storage = new TestStorage();
    const sessions = Array.from({ length: 105 }, (_, index) => session(index));
    saveSessions(sessions, storage);
    const loaded = loadSessions(storage);
    expect(loaded).toHaveLength(100);
    expect(loaded[0]?.id).toBe('session-104');
    expect(Date.parse(loaded[0]!.completedAt)).toBeGreaterThan(
      Date.parse(loaded[1]!.completedAt),
    );

    clearSessions(storage);
    expect(loadSessions(storage)).toEqual([]);
  });

  it('survives storage write failures without throwing', () => {
    const broken: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
      removeItem: () => undefined,
    };
    expect(() => saveSettings(DEFAULT_SETTINGS, broken)).not.toThrow();
    expect(() => saveSessions([session(1)], broken)).not.toThrow();
  });
});
