import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Combination, CompletedSession } from '../../shared/types';
import { CURATED_COMBINATIONS, combinationSignature } from '../../shared/combinations';
import {
  clearSessions,
  loadCustomCombinations,
  loadFavorites,
  loadSessions,
  saveCustomCombinations,
  saveFavorites,
  saveSessions,
} from './storage';

interface DataContextValue {
  customCombinations: Combination[];
  favorites: string[];
  sessions: CompletedSession[];
  addCombinations: (combinations: Combination[]) => number;
  updateCombination: (combination: Combination) => void;
  deleteCombination: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addSession: (session: CompletedSession) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [customCombinations, setCustomCombinations] = useState<Combination[]>(() =>
    loadCustomCombinations(),
  );
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [sessions, setSessions] = useState<CompletedSession[]>(() => loadSessions());

  useEffect(() => {
    saveCustomCombinations(customCombinations);
  }, [customCombinations]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const addCombinations = useCallback(
    (incoming: Combination[]) => {
      const seen = new Set(
        [...CURATED_COMBINATIONS, ...customCombinations].map((combination) =>
          combinationSignature(combination.steps),
        ),
      );
      const additions: Combination[] = [];
      for (const combination of incoming) {
        const signature = combinationSignature(combination.steps);
        if (seen.has(signature)) continue;
        seen.add(signature);
        additions.push({
          ...combination,
          createdAt: combination.createdAt ?? new Date().toISOString(),
        });
      }
      if (additions.length > 0) {
        setCustomCombinations((current) => [...current, ...additions].slice(-200));
      }
      return additions.length;
    },
    [customCombinations],
  );

  const updateCombination = useCallback((combination: Combination) => {
    setCustomCombinations((current) =>
      current.map((item) => (item.id === combination.id ? combination : item)),
    );
  }, []);

  const deleteCombination = useCallback((id: string) => {
    setCustomCombinations((current) => current.filter((item) => item.id !== id));
    setFavorites((current) => current.filter((favorite) => favorite !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id],
    );
  }, []);

  const addSession = useCallback((session: CompletedSession) => {
    setSessions((current) => [session, ...current].slice(0, 100));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((current) => current.filter((session) => session.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
    clearSessions();
  }, []);

  const value = useMemo(
    () => ({
      customCombinations,
      favorites,
      sessions,
      addCombinations,
      updateCombination,
      deleteCombination,
      toggleFavorite,
      addSession,
      deleteSession,
      clearHistory,
    }),
    [
      customCombinations,
      favorites,
      sessions,
      addCombinations,
      updateCombination,
      deleteCombination,
      toggleFavorite,
      addSession,
      deleteSession,
      clearHistory,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider');
  return context;
}
