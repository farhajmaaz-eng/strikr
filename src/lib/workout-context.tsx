import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutConfig } from '../../shared/types';
import { bellAudio } from './audio';
import { primeSpeech } from './speech';
import { useData } from './data-context';
import { useSettings } from './settings-context';
import {
  createWorkoutRun,
  persistWorkout,
  readSavedWorkout,
  removeSavedWorkout,
  type WorkoutLaunchOptions,
  type WorkoutRun,
} from './prepare-workout';

interface WorkoutSessionContextValue {
  run: WorkoutRun | null;
  startWorkout: (config: WorkoutConfig, options?: WorkoutLaunchOptions) => WorkoutRun;
  clearWorkout: () => void;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | null>(null);

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<WorkoutRun | null>(() => readSavedWorkout());
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { favorites } = useData();

  const startWorkout = useCallback(
    (config: WorkoutConfig, options: WorkoutLaunchOptions = {}) => {
      // These fire inside the launch click, unlocking audio and speech on mobile.
      void bellAudio.unlock();
      primeSpeech();

      const nextRun = createWorkoutRun(
        config,
        { favorites, ...options },
        settings.calloutIntervalSeconds,
      );
      persistWorkout(nextRun);
      setRun(nextRun);
      navigate('/workout');
      return nextRun;
    },
    [favorites, navigate, settings.calloutIntervalSeconds],
  );

  const clearWorkout = useCallback(() => {
    removeSavedWorkout();
    setRun(null);
  }, []);

  const value = useMemo(
    () => ({ run, startWorkout, clearWorkout }),
    [run, startWorkout, clearWorkout],
  );

  return (
    <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession(): WorkoutSessionContextValue {
  const context = useContext(WorkoutSessionContext);
  if (!context) {
    throw new Error('useWorkoutSession must be used inside WorkoutSessionProvider');
  }
  return context;
}
