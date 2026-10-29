import type { CompletedSession } from '../../shared/types';

export interface TrainingTotals {
  sessions: number;
  rounds: number;
  trainingSeconds: number;
}

export function totalsFor(sessions: CompletedSession[]): TrainingTotals {
  return sessions.reduce<TrainingTotals>(
    (totals, session) => ({
      sessions: totals.sessions + 1,
      rounds: totals.rounds + session.roundsCompleted,
      trainingSeconds: totals.trainingSeconds + session.trainingSeconds,
    }),
    { sessions: 0, rounds: 0, trainingSeconds: 0 },
  );
}

export function startOfWeek(now = new Date()): Date {
  const date = new Date(now);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date;
}

export function sessionsThisWeek(sessions: CompletedSession[], now = new Date()): CompletedSession[] {
  const start = startOfWeek(now).getTime();
  return sessions.filter((session) => {
    const time = Date.parse(session.completedAt);
    return Number.isFinite(time) && time >= start && time <= now.getTime();
  });
}

export function currentStreakDays(sessions: CompletedSession[], now = new Date()): number {
  const days = new Set(
    sessions.map((session) => {
      const date = new Date(session.completedAt);
      return Number.isNaN(date.getTime())
        ? ''
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }),
  );

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  for (let index = 0; index < 366; index += 1) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!days.has(key)) {
      if (index === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
