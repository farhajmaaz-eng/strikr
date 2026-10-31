import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Clock3,
  CornerUpRight,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { CompletedSession } from '../../shared/types';
import { DISCIPLINE_LABELS } from '../../shared/types';
import { techniqueNameById } from '../../shared/techniques';
import { combinationSignature } from '../../shared/combinations';
import { useData } from '../lib/data-context';
import { useSettings } from '../lib/settings-context';
import { useWorkoutSession } from '../lib/workout-context';
import { WorkoutTimer, type TimerEvent, type TimerSnapshot } from '../lib/timer';
import { calloutFor, dedupeCombinations, type Callout } from '../lib/combinations';
import { bellAudio } from '../lib/audio';
import { cancelSpeech, primeSpeech, speak } from '../lib/speech';
import { createId } from '../lib/id';
import { formatClock, formatDuration, formatRoundLength } from '../lib/format';
import { cn } from '../lib/cn';
import { Button, ConfirmDialog, IconButton, WindowBar, WindowFrame } from '../components/ui';
import { Logo } from '../components/Logo';

interface WorkoutSummary {
  session: CompletedSession;
  saved: boolean;
}

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockNavigator {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

export function WorkoutPage() {
  const { run, clearWorkout, startWorkout } = useWorkoutSession();
  const { settings, updateSettings } = useSettings();
  const { addSession } = useData();
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState<TimerSnapshot | null>(null);
  const [currentCallout, setCurrentCallout] = useState<Callout | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const timerRef = useRef<WorkoutTimer | null>(null);
  const snapshotRef = useRef<TimerSnapshot | null>(null);
  const settingsRef = useRef(settings);
  const runRef = useRef(run);
  const addSessionRef = useRef(addSession);
  const savedRef = useRef(false);
  const usedCombosRef = useRef(new Map<string, { name: string; steps: string[] }>());
  const calloutIndexRef = useRef(0);
  const lastCalloutSignatureRef = useRef('');
  const nextCalloutAtRef = useRef(0);
  const lastBeepKeyRef = useRef('');
  const processEventsRef = useRef<(events: TimerEvent[], snap: TimerSnapshot) => void>(() => undefined);

  const applySnapshot = useCallback((next: TimerSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const finalizeSession = useCallback((snap: TimerSnapshot, endedEarly: boolean) => {
    if (savedRef.current) return;
    const activeRun = runRef.current;
    if (!activeRun) return;

    const shouldSave = !endedEarly || snap.completedRounds > 0 || snap.elapsedMs >= 10_000;
    const session: CompletedSession = {
      id: createId('session'),
      completedAt: new Date().toISOString(),
      discipline: activeRun.config.discipline,
      stance: activeRun.config.stance,
      level: activeRun.config.level,
      focus: activeRun.config.focus,
      roundsPlanned: activeRun.config.rounds,
      roundsCompleted: snap.completedRounds,
      skippedRounds: snap.skippedRounds,
      roundSeconds: activeRun.config.roundSeconds,
      restSeconds: activeRun.config.restSeconds,
      trainingSeconds: Math.max(0, Math.round(snap.elapsedMs / 1000)),
      endedEarly,
      combinations: [...usedCombosRef.current.values()],
    };

    savedRef.current = true;
    if (shouldSave) addSessionRef.current(session);
    cancelSpeech();
    setSummary({ session, saved: shouldSave });
  }, []);

  const processEvents = useCallback(
    (events: TimerEvent[], snap: TimerSnapshot) => {
      if (events.length === 0) return;
      const complete = events.some((event) => event.type === 'workout-complete');
      const ended = events.some((event) => event.type === 'workout-ended');
      const roundStart = events.some((event) => event.type === 'round-start');
      const roundEnd = events.some((event) => event.type === 'round-end');
      const skipped = events.some((event) => event.type === 'round-skipped');
      const { soundEnabled, bellVolume } = settingsRef.current;

      if (!document.hidden && soundEnabled) {
        if (complete) {
          bellAudio.playBell(bellVolume, 3);
        } else if (roundStart) {
          bellAudio.playBell(bellVolume, 1);
        } else if (roundEnd && !skipped) {
          bellAudio.playBell(bellVolume, 2);
        }
      }

      if (complete) {
        finalizeSession(snap, false);
      } else if (ended) {
        finalizeSession(snap, true);
      }
    },
    [finalizeSession],
  );

  useEffect(() => {
    processEventsRef.current = processEvents;
  }, [processEvents]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    addSessionRef.current = addSession;
  }, [addSession]);

  // Timer lifecycle. Timestamps live in the engine; this loop only paints and reacts.
  useEffect(() => {
    if (!run) return;
    timerRef.current = null;
    savedRef.current = false;
    usedCombosRef.current = new Map();
    calloutIndexRef.current = 0;
    lastCalloutSignatureRef.current = '';
    nextCalloutAtRef.current = 0;
    lastBeepKeyRef.current = '';

    const timer = new WorkoutTimer({
      rounds: run.config.rounds,
      roundSeconds: run.config.roundSeconds,
      restSeconds: run.config.restSeconds,
      countInSeconds: run.config.countInSeconds,
    });
    timerRef.current = timer;

    const startEvents = timer.start(Date.now());
    const initialSnapshot = timer.getSnapshot();
    // The engine is the external clock; paint its first reading immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applySnapshot(initialSnapshot);
    processEventsRef.current(startEvents, initialSnapshot);

    const tick = () => {
      const now = Date.now();
      const events = timer.tick(now);
      const next = timer.getSnapshot(now);
      applySnapshot(next);
      processEventsRef.current(events, next);
    };

    const interval = window.setInterval(tick, 200);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      timerRef.current = null;
      cancelSpeech();
    };
  }, [run, applySnapshot]);

  // Combination callouts are only generated locally from the prebuilt pool.
  const calloutPhase = snapshot?.phase;
  const calloutRound = snapshot?.round;
  useEffect(() => {
    if (!run || calloutPhase !== 'round') return;

    const callouts = run.callouts;
    if (callouts.length === 0) return;
    const intervalMs = Math.max(5, settingsRef.current.calloutIntervalSeconds) * 1000;

    const deliver = () => {
      const current = snapshotRef.current;
      if (!current || current.status !== 'running' || current.phase !== 'round') return;

      let index = calloutIndexRef.current % callouts.length;
      let combination = callouts[index];
      let guard = 0;
      while (
        combination &&
        combinationSignature(combination.steps) === lastCalloutSignatureRef.current &&
        callouts.length > 1 &&
        guard < callouts.length
      ) {
        index += 1;
        guard += 1;
        combination = callouts[index % callouts.length];
      }
      if (!combination) return;

      calloutIndexRef.current = index + 1;
      const signature = combinationSignature(combination.steps);
      lastCalloutSignatureRef.current = signature;
      usedCombosRef.current.set(signature, {
        name: combination.name,
        steps: [...combination.steps],
      });

      const callout = calloutFor(combination, run.config.stance);
      setCurrentCallout(callout);
      if (settingsRef.current.speechEnabled) {
        speak(callout.spoken, {
          rate: settingsRef.current.speechRate,
          voiceURI: settingsRef.current.voiceURI,
        });
      }
    };

    nextCalloutAtRef.current = Date.now() + 850;
    const initial = window.setTimeout(() => {
      deliver();
      nextCalloutAtRef.current = Date.now() + intervalMs;
    }, 850);

    const interval = window.setInterval(() => {
      const now = Date.now();
      if (now < nextCalloutAtRef.current) return;
      deliver();
      nextCalloutAtRef.current = now + intervalMs;
    }, 350);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [run, calloutPhase, calloutRound]);

  useEffect(() => {
    if (calloutPhase === 'rest' || calloutPhase === 'complete') {
      cancelSpeech();
    }
  }, [calloutPhase]);

  // Count-in ticks and final-three-second cues.
  useEffect(() => {
    if (!snapshot || snapshot.status !== 'running') return;
    if (!settingsRef.current.soundEnabled) return;
    const seconds = Math.ceil(snapshot.remainingMs / 1000);
    if (seconds < 1 || seconds > 3) return;
    if (snapshot.phase !== 'prepare' && snapshot.phase !== 'round') return;

    const key = `${snapshot.phase}-${snapshot.round}-${seconds}`;
    if (lastBeepKeyRef.current === key) return;
    lastBeepKeyRef.current = key;
    bellAudio.playCountdown(settingsRef.current.bellVolume);
  }, [snapshot]);

  // Keep the screen awake while the clock is running.
  const timerStatus = snapshot?.status;
  useEffect(() => {
    if (!settings.wakeLockEnabled || typeof navigator === 'undefined') return;
    const wakeLock = (navigator as Navigator & WakeLockNavigator).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled || snapshotRef.current?.status !== 'running') return;
      if (document.visibilityState !== 'visible') return;
      try {
        sentinel = await wakeLock.request('screen');
      } catch {
        // Wake lock is optional; training continues without it.
      }
    };

    if (timerStatus === 'running') void acquire();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel) void sentinel.release().catch(() => undefined);
    };
  }, [settings.wakeLockEnabled, timerStatus]);

  useEffect(() => {
    if (!run && !summary) {
      navigate('/setup', { replace: true });
    }
  }, [run, summary, navigate]);

  const togglePause = () => {
    const timer = timerRef.current;
    if (!timer) return;
    const now = Date.now();
    const current = snapshotRef.current;
    if (!current) return;

    if (current.status === 'running') {
      timer.pause(now);
      cancelSpeech();
    } else if (current.status === 'paused') {
      void bellAudio.unlock();
      primeSpeech();
      timer.resume(now);
    }
    const next = timer.getSnapshot(now);
    applySnapshot(next);
    processEventsRef.current([], next);
  };

  const skip = () => {
    const timer = timerRef.current;
    if (!timer) return;
    cancelSpeech();
    const now = Date.now();
    const events = timer.skip(now);
    const next = timer.getSnapshot(now);
    applySnapshot(next);
    processEventsRef.current(events, next);
  };

  const endSession = () => {
    const timer = timerRef.current;
    if (!timer) return;
    const now = Date.now();
    const events = timer.end(now);
    const next = timer.getSnapshot(now);
    applySnapshot(next);
    setConfirmEnd(false);
    if (settingsRef.current.soundEnabled) {
      bellAudio.playBell(settingsRef.current.bellVolume, 1);
    }
    processEventsRef.current(events, next);
    finalizeSession(next, true);
  };

  const goHome = () => {
    navigate('/', { replace: true });
    clearWorkout();
  };

  const trainAgain = () => {
    if (!run) return;
    setSummary(null);
    setCurrentCallout(null);
    setConfirmEnd(false);
    startWorkout(run.config, {
      source: run.source,
      title: run.title,
      extraCombinations: dedupeCombinations(run.callouts),
    });
  };

  const toggleSound = () => {
    void bellAudio.unlock();
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleSpeech = () => {
    primeSpeech();
    if (settings.speechEnabled) cancelSpeech();
    updateSettings({ speechEnabled: !settings.speechEnabled });
  };

  const totalRounds = run?.config.rounds ?? 0;
  const completed = new Set(snapshot?.completedRoundNumbers ?? []);
  const skipped = new Set(snapshot?.skippedRounds ?? []);
  const activeCallout = currentCallout;

  if (!run) return null;

  if (summary) {
    return (
      <WorkoutSummaryView
        summary={summary}
        onDone={goHome}
        onAgain={trainAgain}
        onHistory={() => {
          clearWorkout();
          navigate('/history', { replace: true });
        }}
        title={run.title}
      />
    );
  }

  const phase = snapshot?.phase ?? 'prepare';
  const status = snapshot?.status ?? 'idle';
  const remainingMs = snapshot?.remainingMs ?? run.config.countInSeconds * 1000;
  const phaseDuration = snapshot?.phaseDurationMs ?? 1;
  const phaseProgress =
    phaseDuration > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / phaseDuration)) : 0;
  const round = snapshot?.round ?? 1;
  const isPaused = status === 'paused';
  const statusLabel = isPaused
    ? 'Paused'
    : phase === 'prepare'
      ? 'Ready'
      : phase === 'round'
        ? 'Round live'
        : phase === 'rest'
          ? 'Recover'
          : 'Complete';

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <header className="border-b border-line bg-coal">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo compact />
            <span className="h-6 w-px bg-line" />
            <div className="min-w-0">
              <p className="meta-label text-accent">Live session</p>
              <p className="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-mist">
                {DISCIPLINE_LABELS[run.config.discipline]} / {run.config.stance} / {run.config.level}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              label={settings.soundEnabled ? 'Mute bells' : 'Unmute bells'}
              onClick={toggleSound}
              className="!size-8"
            >
              {settings.soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </IconButton>
            <IconButton
              label={settings.speechEnabled ? 'Mute spoken callouts' : 'Unmute spoken callouts'}
              onClick={toggleSpeech}
              className="!size-8"
            >
              {settings.speechEnabled ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
            </IconButton>
            <IconButton
              label="End session"
              onClick={() => setConfirmEnd(true)}
              className="!size-8 hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
            >
              <X className="size-3.5" />
            </IconButton>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line px-3 py-2 sm:px-5">
          <span className="meta-label shrink-0">Rounds</span>
          <div className="flex flex-1 gap-1">
            {Array.from({ length: totalRounds }, (_, index) => {
              const roundNumber = index + 1;
              const isCurrent = roundNumber === round && phase === 'round';
              const isRest = roundNumber === round && phase === 'rest';
              const isDone = completed.has(roundNumber);
              const isSkipped = skipped.has(roundNumber);
              return (
                <div
                  key={roundNumber}
                  aria-hidden
                  className={cn(
                    'h-2 flex-1 border transition-colors duration-200',
                    isDone && 'border-accent bg-accent',
                    isSkipped && 'border-danger/50 bg-danger/40',
                    isCurrent && 'border-paper bg-paper',
                    isRest && 'border-accent/60 bg-accent/40',
                    !isDone && !isSkipped && !isCurrent && !isRest && 'border-line bg-ink-soft',
                  )}
                />
              );
            })}
          </div>
          <span className="shrink-0 font-mono text-[9px] tabular-nums text-mist-dim">
            {String(completed.size).padStart(2, '0')}/{String(totalRounds).padStart(2, '0')}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4">
        <section className="window-panel flex flex-1 flex-col">
          <WindowBar
            title={`${statusLabel} / round ${round} of ${totalRounds}`}
            code={phase.toUpperCase()}
            actions={
              <span className="hidden font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim sm:inline">
                {isPaused ? 'timer frozen' : 'timestamp clock'}
              </span>
            }
          />
          <div className="flex flex-1 flex-col items-center justify-center px-3 py-5 sm:py-8">
            <div className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">
              <span
                className={cn(
                  'size-1.5',
                  isPaused
                    ? 'bg-mist-dim'
                    : phase === 'rest'
                      ? 'bg-accent/60'
                      : phase === 'prepare'
                        ? 'bg-mist'
                        : 'bg-accent animate-blink',
                )}
              />
              <span className={phase === 'rest' ? 'text-accent-bright' : 'text-mist'}>{statusLabel}</span>
              <span className="text-mist-dim/50">/</span>
              <span className="text-mist-dim">
                {phase === 'rest'
                  ? `${formatRoundLength(run.config.restSeconds)} rest`
                  : `round ${round} of ${totalRounds}`}
              </span>
            </div>

            <p
              className={cn(
                'hero-number mt-2 font-display font-semibold leading-[0.8] tracking-[-0.03em] text-paper',
                'text-[clamp(5.5rem,28vw,11rem)]',
                isPaused && 'text-mist',
              )}
              aria-live="off"
            >
              {formatClock(remainingMs)}
            </p>

            <div className="mt-4 w-full max-w-md">
              <div className="mb-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
                <span>{phase === 'rest' ? 'Recovery' : phase === 'prepare' ? 'Count-in' : 'Round elapsed'}</span>
                <span className="tabular-nums">{Math.round(phaseProgress * 100)}%</span>
              </div>
              <div className="h-2.5 border border-line bg-ink-soft p-px">
                <div
                  className={cn(
                    'h-full transition-[width] duration-200 ease-linear',
                    phase === 'rest' ? 'bg-accent/60' : 'bg-accent',
                  )}
                  style={{ width: `${phaseProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="window-panel mt-2">
          <WindowBar
            title="callout / active"
            code={phase === 'rest' ? 'REST' : phase === 'prepare' ? 'READY' : 'WORK'}
          />
          <div className="flex min-h-[7.5rem] flex-col items-center justify-center px-3 py-4 text-center sm:min-h-[8.5rem] sm:px-5">
            {phase === 'prepare' ? (
              <>
                <p className="meta-label text-accent">Count-in</p>
                <h2 className="mt-1.5 font-display text-2xl font-semibold uppercase leading-none sm:text-3xl">
                  Hands up. Find your range.
                </h2>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-mist-dim">
                  {run.config.rounds} rounds / {formatRoundLength(run.config.roundSeconds)} work /{' '}
                  {run.config.restSeconds > 0
                    ? `${formatRoundLength(run.config.restSeconds)} rest`
                    : 'no rest'}
                </p>
              </>
            ) : phase === 'rest' ? (
              <>
                <p className="meta-label text-accent">Round {round} complete</p>
                <h2 className="mt-1.5 font-display text-2xl font-semibold uppercase leading-none sm:text-3xl">
                  Breathe. Reset.
                </h2>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-mist-dim">
                  Next: round {Math.min(round + 1, totalRounds)} of {totalRounds}
                </p>
              </>
            ) : activeCallout ? (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <p className="meta-label text-accent">Callout</p>
                  <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-mist-dim">
                    {activeCallout.combination.name}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1">
                  {activeCallout.combination.steps.map((step, index) => {
                    const calloutText = activeCallout.display.split(' · ')[index] ?? step;
                    return (
                      <span
                        key={`${step}-${index}`}
                        className="border border-line bg-ink-soft px-2 py-1 text-[12px] font-medium text-paper sm:px-2.5 sm:py-1.5 sm:text-sm"
                      >
                        {calloutText}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
                  {formatRoundLength(run.config.roundSeconds)} round / {run.config.focus}
                </p>
              </>
            ) : (
              <>
                <p className="meta-label text-accent">Ready</p>
                <h2 className="mt-1.5 font-display text-2xl font-semibold uppercase leading-none">
                  First bell coming up.
                </h2>
                <p className="mt-2 text-[11px] text-mist-dim">Listen for the combination, then work.</p>
              </>
            )}
          </div>
        </section>

        <div className="mt-2 w-full">
          <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
            <Button
              size="lg"
              variant={isPaused ? 'primary' : 'secondary'}
              onClick={togglePause}
              icon={
                isPaused ? <Play className="size-4 fill-current" /> : <Pause className="size-4 fill-current" />
              }
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <IconButton
              label={phase === 'rest' ? 'Skip rest' : 'Skip round'}
              onClick={skip}
              className="!size-12"
            >
              <SkipForward className="size-4" />
            </IconButton>
            <IconButton
              label="End session"
              onClick={() => setConfirmEnd(true)}
              className="!size-12 hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
            >
              <Square className="size-3.5 fill-current" />
            </IconButton>
          </div>
          <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.06em] text-mist-dim">
            {isPaused
              ? 'Timer frozen. Resume when your guard is up.'
              : 'Timestamp clock. Keeps time even if the tab sleeps.'}
          </p>
        </div>
      </main>

      <ConfirmDialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={endSession}
        title="End this session?"
        description="Completed rounds, training time, and callouts are saved to your local history."
        confirmLabel="End session"
      />
    </div>
  );
}

function WorkoutSummaryView({
  summary,
  onDone,
  onAgain,
  onHistory,
  title,
}: {
  summary: WorkoutSummary;
  onDone: () => void;
  onAgain: () => void;
  onHistory: () => void;
  title?: string;
}) {
  const { session, saved } = summary;
  const headline = session.endedEarly
    ? session.roundsCompleted > 0
      ? { lead: 'Clock', accent: 'out.' }
      : { lead: 'Bell', accent: 'stopped.' }
    : { lead: 'Work', accent: 'banked.' };
  const roundNoun = session.roundsPlanned === 1 ? 'round' : 'rounds';

  return (
    <div className="flex min-h-dvh flex-col bg-ink px-3 py-3 sm:px-5 sm:py-4">
      <header className="mb-2 flex items-center justify-between border border-line bg-coal px-3 py-2">
        <Logo />
        <span className="border border-line bg-panel px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-mist-dim">
          {saved ? 'Saved locally' : 'Not saved'}
        </span>
      </header>

      <WindowFrame title="session / summary" code={session.endedEarly ? 'ENDED' : 'COMPLETE'} active className="mx-auto w-full max-w-2xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center border border-success/40 bg-success/10 text-success">
              <Check className="size-3.5" />
            </span>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-success">
              {session.endedEarly ? 'Session ended' : 'Workout complete'}
            </p>
          </div>

          <h1 className="mt-3 font-display text-[56px] font-semibold uppercase leading-[0.8] tracking-[-0.01em] sm:text-[76px]">
            {headline.lead}
            <br />
            <span className="text-accent">{headline.accent}</span>
          </h1>
          <p className="mt-3 max-w-md text-[12px] leading-relaxed text-mist">
            {title ? `${title} / ` : ''}
            {session.endedEarly
              ? session.roundsCompleted > 0
                ? `${session.roundsCompleted} of ${session.roundsPlanned} ${roundNoun} completed before you stopped the clock.`
                : 'No rounds were completed before you stopped the clock.'
              : `${session.roundsCompleted} of ${session.roundsPlanned} ${roundNoun} completed. Every clean repetition counts.`}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-1.5">
            <SummaryStat value={`${session.roundsCompleted}/${session.roundsPlanned}`} label="Rounds" />
            <SummaryStat value={formatDuration(session.trainingSeconds, { compact: true })} label="Training time" />
            <SummaryStat value={String(session.combinations.length)} label="Callouts" />
          </div>

          {!saved ? (
            <p className="mt-3 border-l-2 border-accent bg-ink-soft px-3 py-2 font-mono text-[9px] leading-relaxed text-mist-dim">
              This session was too short to log. Start another when you're ready.
            </p>
          ) : null}

          {session.combinations.length > 0 ? (
            <div className="mt-3 border border-line bg-ink-soft">
              <div className="window-bar min-h-7 border-line px-2">
                <span className="window-title">combinations thrown</span>
                <span className="window-code">{String(session.combinations.length).padStart(2, '0')}</span>
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto p-2.5">
                {session.combinations.slice(0, 12).map((combination, index) => (
                  <div key={`${combination.name}-${index}`} className="flex items-start gap-2">
                    <span className="mt-0.5 border border-line bg-panel px-1 py-0.5 font-mono text-[8px] font-semibold tabular-nums text-accent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-mist">{combination.name}</p>
                      <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.04em] text-mist-dim">
                        {combination.steps
                          .map((step) => techniqueNameById(step, session.stance))
                          .join(' / ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-1.5 sm:grid-cols-[1fr_auto_auto]">
            <Button size="lg" onClick={onDone} icon={<CornerUpRight className="size-4" />}>
              Done
            </Button>
            <Button size="lg" variant="secondary" onClick={onAgain} icon={<RotateCcw className="size-3.5" />}>
              Train again
            </Button>
            <Button size="lg" variant="ghost" onClick={onHistory}>
              History <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-line bg-ink-soft px-3 py-2 pb-safe font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
          <Clock3 className="size-3" />
          {formatRoundLength(session.roundSeconds)} {roundNoun} /{' '}
          {session.restSeconds > 0 ? `${formatRoundLength(session.restSeconds)} rest` : 'no rest'}
        </div>
      </WindowFrame>
    </div>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-line bg-ink-soft px-2 py-3 text-center">
      <p className="font-display text-2xl font-semibold leading-none tabular-nums text-paper">{value}</p>
      <p className="mt-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-mist-dim">{label}</p>
    </div>
  );
}
