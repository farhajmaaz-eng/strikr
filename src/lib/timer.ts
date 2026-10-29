export const TIMER_PHASES = ['prepare', 'round', 'rest', 'complete'] as const;
export type TimerPhase = (typeof TIMER_PHASES)[number];

export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete' | 'ended';

export interface TimerConfig {
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
  countInSeconds: number;
}

export type TimerEvent =
  | { type: 'round-start'; round: number; at: number }
  | { type: 'rest-start'; round: number; at: number }
  | { type: 'round-skipped'; round: number; at: number }
  | { type: 'round-end'; round: number; at: number }
  | { type: 'workout-complete'; at: number }
  | { type: 'workout-ended'; at: number };

export interface TimerSnapshot {
  phase: TimerPhase;
  status: TimerStatus;
  round: number;
  rounds: number;
  phaseDurationMs: number;
  remainingMs: number;
  completedRounds: number;
  completedRoundNumbers: number[];
  skippedRounds: number[];
  elapsedMs: number;
  isFinalRound: boolean;
}

export class WorkoutTimer {
  private readonly config: TimerConfig;

  private phase: TimerPhase = 'prepare';
  private status: TimerStatus = 'idle';
  private round = 1;
  private phaseEndsAt = 0;
  private pausedRemainingMs = 0;
  private completedRounds = 0;
  private completedRoundNumbers: number[] = [];
  private skippedRounds: number[] = [];
  private activeStartedAt: number | null = null;
  private accumulatedActiveMs = 0;

  constructor(config: TimerConfig) {
    this.config = {
      rounds: clampInt(config.rounds, 1, 20),
      roundSeconds: clampInt(config.roundSeconds, 15, 900),
      restSeconds: clampInt(config.restSeconds, 0, 300),
      countInSeconds: clampInt(config.countInSeconds, 0, 30),
    };
    if (this.config.countInSeconds === 0) this.phase = 'round';
  }

  start(now: number = Date.now()): TimerEvent[] {
    if (this.status !== 'idle') return [];
    this.status = 'running';
    this.activeStartedAt = now;

    if (this.config.countInSeconds > 0) {
      this.setPhase('prepare', this.config.countInSeconds * 1000, now);
      return [];
    }

    this.beginRound(1, now);
    return [{ type: 'round-start', round: 1, at: now }];
  }

  tick(now: number = Date.now()): TimerEvent[] {
    if (this.status !== 'running') return [];
    const events: TimerEvent[] = [];
    let guard = 0;

    while (this.status === 'running' && now >= this.phaseEndsAt && guard < 100) {
      guard += 1;
      this.advance(this.phaseEndsAt, false, events);
    }

    return events;
  }

  pause(now: number = Date.now()): TimerEvent[] {
    if (this.status !== 'running') return [];
    this.pausedRemainingMs = Math.max(0, this.phaseEndsAt - now);
    if (this.activeStartedAt !== null) {
      this.accumulatedActiveMs += Math.max(0, now - this.activeStartedAt);
    }
    this.activeStartedAt = null;
    this.status = 'paused';
    return [];
  }

  resume(now: number = Date.now()): TimerEvent[] {
    if (this.status !== 'paused') return [];
    this.phaseEndsAt = now + this.pausedRemainingMs;
    this.activeStartedAt = now;
    this.status = 'running';

    if (this.pausedRemainingMs <= 0) {
      return this.tick(now);
    }
    return [];
  }

  skip(now: number = Date.now()): TimerEvent[] {
    if (this.status === 'idle') return [];
    if (this.status === 'complete' || this.status === 'ended') return [];

    const wasPaused = this.status === 'paused';
    if (wasPaused) {
      this.status = 'running';
      this.activeStartedAt = now;
    }

    const events: TimerEvent[] = [];
    this.advancePhase(now, true, events);
    return events;
  }

  end(now: number = Date.now()): TimerEvent[] {
    if (this.status === 'idle' || this.status === 'complete' || this.status === 'ended') {
      return [];
    }
    this.finalizeActive(now);
    this.status = 'ended';
    return [{ type: 'workout-ended', at: now }];
  }

  getSnapshot(now: number = Date.now()): TimerSnapshot {
    const phaseDurationMs = this.phaseDurationMs();
    let remainingMs: number;

    if (this.status === 'running') {
      remainingMs = Math.max(0, this.phaseEndsAt - now);
    } else if (this.status === 'paused') {
      remainingMs = this.pausedRemainingMs;
    } else if (this.status === 'idle') {
      remainingMs = phaseDurationMs;
    } else {
      remainingMs = 0;
    }

    const elapsedMs =
      this.accumulatedActiveMs +
      (this.activeStartedAt !== null ? Math.max(0, now - this.activeStartedAt) : 0);

    return {
      phase: this.status === 'complete' ? 'complete' : this.phase,
      status: this.status,
      round: this.round,
      rounds: this.config.rounds,
      phaseDurationMs,
      remainingMs,
      completedRounds: this.completedRounds,
      completedRoundNumbers: [...this.completedRoundNumbers],
      skippedRounds: [...this.skippedRounds],
      elapsedMs,
      isFinalRound: this.round >= this.config.rounds,
    };
  }

  private advance(at: number, skipped: boolean, events: TimerEvent[]): void {
    this.advancePhase(at, skipped, events);
  }

  private advancePhase(at: number, skipped: boolean, events: TimerEvent[]): void {
    if (this.phase === 'prepare') {
      this.beginRound(this.round, at, events);
      return;
    }

    if (this.phase === 'rest') {
      this.beginRound(Math.min(this.round + 1, this.config.rounds), at, events);
      return;
    }

    if (this.phase === 'round') {
      events.push({ type: 'round-end', round: this.round, at });
      if (skipped) {
        this.skippedRounds.push(this.round);
        events.push({ type: 'round-skipped', round: this.round, at });
      } else {
        this.completedRounds += 1;
        this.completedRoundNumbers.push(this.round);
      }

      if (this.round >= this.config.rounds) {
        this.finalizeActive(at);
        this.status = 'complete';
        this.phase = 'complete';
        this.phaseEndsAt = at;
        events.push({ type: 'workout-complete', at });
        return;
      }

      if (this.config.restSeconds > 0) {
        this.setPhase('rest', this.config.restSeconds * 1000, at);
        events.push({ type: 'rest-start', round: this.round, at });
        return;
      }

      this.beginRound(this.round + 1, at, events);
    }
  }

  private beginRound(round: number, at: number, events?: TimerEvent[]): void {
    this.round = round;
    this.setPhase('round', this.config.roundSeconds * 1000, at);
    events?.push({ type: 'round-start', round, at });
  }

  private setPhase(phase: TimerPhase, durationMs: number, at: number): void {
    this.phase = phase;
    this.phaseEndsAt = at + durationMs;
    this.pausedRemainingMs = durationMs;
  }

  private phaseDurationMs(): number {
    if (this.phase === 'prepare') return this.config.countInSeconds * 1000;
    if (this.phase === 'round') return this.config.roundSeconds * 1000;
    if (this.phase === 'rest') return this.config.restSeconds * 1000;
    return 0;
  }

  private finalizeActive(at: number): void {
    if (this.activeStartedAt !== null) {
      this.accumulatedActiveMs += Math.max(0, at - this.activeStartedAt);
      this.activeStartedAt = null;
    }
  }
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
