import { describe, expect, it } from 'vitest';
import { WorkoutTimer } from '../src/lib/timer';

describe('WorkoutTimer', () => {
  it('transitions round → rest → round → complete from timestamps', () => {
    const timer = new WorkoutTimer({
      rounds: 2,
      roundSeconds: 60,
      restSeconds: 30,
      countInSeconds: 0,
    });

    expect(timer.start(1000).map((event) => event.type)).toEqual(['round-start']);
    let snapshot = timer.getSnapshot(1000);
    expect(snapshot).toMatchObject({
      phase: 'round',
      status: 'running',
      round: 1,
      remainingMs: 60_000,
    });

    const restEvents = timer.tick(61_000);
    snapshot = timer.getSnapshot(61_000);
    expect(restEvents.map((event) => event.type)).toEqual(['round-end', 'rest-start']);
    expect(snapshot).toMatchObject({
      phase: 'rest',
      completedRounds: 1,
      completedRoundNumbers: [1],
      round: 1,
      remainingMs: 30_000,
    });

    const roundTwoEvents = timer.tick(91_000);
    snapshot = timer.getSnapshot(91_000);
    expect(roundTwoEvents.map((event) => event.type)).toEqual(['round-start']);
    expect(snapshot).toMatchObject({ phase: 'round', round: 2, remainingMs: 60_000 });

    const completeEvents = timer.tick(151_000);
    snapshot = timer.getSnapshot(151_000);
    expect(completeEvents.map((event) => event.type)).toEqual([
      'round-end',
      'workout-complete',
    ]);
    expect(snapshot).toMatchObject({
      phase: 'complete',
      status: 'complete',
      completedRounds: 2,
      completedRoundNumbers: [1, 2],
      elapsedMs: 150_000,
    });
  });

  it('freezes remaining time while paused and excludes pause time from elapsed', () => {
    const timer = new WorkoutTimer({
      rounds: 1,
      roundSeconds: 60,
      restSeconds: 0,
      countInSeconds: 0,
    });
    timer.start(0);
    timer.pause(30_000);

    let snapshot = timer.getSnapshot(30_000);
    expect(snapshot.status).toBe('paused');
    expect(snapshot.remainingMs).toBe(30_000);
    expect(snapshot.elapsedMs).toBe(30_000);

    timer.tick(45_000);
    expect(timer.getSnapshot(45_000).remainingMs).toBe(30_000);
    expect(timer.getSnapshot(45_000).elapsedMs).toBe(30_000);

    timer.resume(50_000);
    timer.tick(79_000);
    expect(timer.getSnapshot(79_000).status).toBe('running');
    expect(timer.getSnapshot(79_000).remainingMs).toBe(1_000);
    expect(timer.getSnapshot(79_000).elapsedMs).toBe(59_000);

    const events = timer.tick(80_000);
    snapshot = timer.getSnapshot(80_000);
    expect(events.map((event) => event.type)).toEqual(['round-end', 'workout-complete']);
    expect(snapshot.status).toBe('complete');
    expect(snapshot.elapsedMs).toBe(60_000);
  });

  it('catches up multiple phases after a throttled background tab', () => {
    const timer = new WorkoutTimer({
      rounds: 3,
      roundSeconds: 30,
      restSeconds: 10,
      countInSeconds: 0,
    });
    const startEvents = timer.start(0);
    const events = [...startEvents, ...timer.tick(200_000)];
    const snapshot = timer.getSnapshot(200_000);

    expect(snapshot.status).toBe('complete');
    expect(snapshot.completedRounds).toBe(3);
    expect(snapshot.elapsedMs).toBe(110_000);
    expect(events.filter((event) => event.type === 'round-start')).toHaveLength(3);
    expect(events.some((event) => event.type === 'workout-complete')).toBe(true);
  });

  it('runs a count-in prepare phase before the first round', () => {
    const timer = new WorkoutTimer({
      rounds: 1,
      roundSeconds: 60,
      restSeconds: 0,
      countInSeconds: 10,
    });
    timer.start(0);
    expect(timer.getSnapshot(0)).toMatchObject({ phase: 'prepare', remainingMs: 10_000 });
    const events = timer.tick(10_000);
    expect(events.map((event) => event.type)).toEqual(['round-start']);
    expect(timer.getSnapshot(10_000)).toMatchObject({ phase: 'round', round: 1 });
  });

  it('tracks skipped rounds without counting them as completed', () => {
    const timer = new WorkoutTimer({
      rounds: 2,
      roundSeconds: 60,
      restSeconds: 30,
      countInSeconds: 0,
    });
    timer.start(0);
    const firstSkip = timer.skip(5_000);
    expect(firstSkip.map((event) => event.type)).toEqual([
      'round-end',
      'round-skipped',
      'rest-start',
    ]);
    let snapshot = timer.getSnapshot(5_000);
    expect(snapshot).toMatchObject({
      phase: 'rest',
      completedRounds: 0,
      skippedRounds: [1],
      completedRoundNumbers: [],
    });

    timer.skip(6_000);
    expect(timer.getSnapshot(6_000)).toMatchObject({ phase: 'round', round: 2 });

    const lastSkip = timer.skip(7_000);
    snapshot = timer.getSnapshot(7_000);
    expect(lastSkip.map((event) => event.type)).toEqual([
      'round-end',
      'round-skipped',
      'workout-complete',
    ]);
    expect(snapshot).toMatchObject({
      status: 'complete',
      completedRounds: 0,
      skippedRounds: [1, 2],
    });
  });

  it('ignores duplicate start calls and stops ticking after an early end', () => {
    const timer = new WorkoutTimer({
      rounds: 3,
      roundSeconds: 60,
      restSeconds: 30,
      countInSeconds: 0,
    });
    timer.start(0);
    expect(timer.start(1_000)).toEqual([]);

    const endEvents = timer.end(25_000);
    expect(endEvents.map((event) => event.type)).toEqual(['workout-ended']);
    const snapshot = timer.getSnapshot(25_000);
    expect(snapshot).toMatchObject({ status: 'ended', elapsedMs: 25_000 });
    expect(timer.tick(100_000)).toEqual([]);
    expect(timer.getSnapshot(100_000).elapsedMs).toBe(25_000);
  });

  it('moves directly to the next round when rest is disabled', () => {
    const timer = new WorkoutTimer({
      rounds: 2,
      roundSeconds: 30,
      restSeconds: 0,
      countInSeconds: 0,
    });
    timer.start(0);
    const events = timer.tick(30_000);
    expect(events.map((event) => event.type)).toEqual([
      'round-end',
      'round-start',
    ]);
    expect(timer.getSnapshot(30_000)).toMatchObject({ phase: 'round', round: 2 });
  });
});
