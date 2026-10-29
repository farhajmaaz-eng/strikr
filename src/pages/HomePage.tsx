import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  Layers3,
  Play,
  SlidersHorizontal,
  Sparkles,
  Swords,
  WifiOff,
  Zap,
} from 'lucide-react';
import type { Discipline, Focus } from '../../shared/types';
import { DISCIPLINES, DISCIPLINE_LABELS, FOCUS_LABELS, FOCUSES } from '../../shared/types';
import { techniqueIdsFor } from '../../shared/techniques';
import { CURATED_COMBINATIONS } from '../../shared/combinations';
import { useData } from '../lib/data-context';
import { useSettings } from '../lib/settings-context';
import { useWorkoutSession } from '../lib/workout-context';
import { formatDuration, formatRoundLength } from '../lib/format';
import { sessionsThisWeek, totalsFor } from '../lib/stats';
import { cn } from '../lib/cn';
import { Button, Chip, Segmented, StatTile } from '../components/ui';
import { SessionCard } from '../components/SessionCard';

interface QuickPreset {
  id: string;
  label: string;
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
}

const presets: QuickPreset[] = [
  { id: 'quick', label: 'Quick 3×2', rounds: 3, roundSeconds: 120, restSeconds: 60 },
  { id: 'standard', label: 'Standard 6×3', rounds: 6, roundSeconds: 180, restSeconds: 60 },
  { id: 'camp', label: 'Camp 10×3', rounds: 10, roundSeconds: 180, restSeconds: 60 },
  { id: 'conditioning', label: 'Conditioning', rounds: 8, roundSeconds: 120, restSeconds: 30 },
];

export function HomePage() {
  const { settings } = useSettings();
  const { sessions, customCombinations, favorites } = useData();
  const { startWorkout } = useWorkoutSession();
  const [discipline, setDiscipline] = useState<Discipline>(settings.defaultDiscipline);
  const [preset, setPreset] = useState<QuickPreset>(() => {
    return (
      presets.find(
        (item) =>
          item.rounds === settings.defaultRounds &&
          item.roundSeconds === settings.defaultRoundSeconds &&
          item.restSeconds === settings.defaultRestSeconds,
      ) ?? presets[1]!
    );
  });

  const weekSessions = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const weekTotals = useMemo(() => totalsFor(weekSessions), [weekSessions]);
  const allTotals = useMemo(() => totalsFor(sessions), [sessions]);
  const recent = sessions.slice(0, 2);
  const libraryCount = CURATED_COMBINATIONS.length + customCombinations.length;
  const focus = safeFocus(settings.defaultFocus, discipline);

  const start = () => {
    startWorkout(
      {
        discipline,
        stance: settings.defaultStance,
        level: settings.defaultLevel,
        rounds: preset.rounds,
        roundSeconds: preset.roundSeconds,
        restSeconds: preset.restSeconds,
        focus,
        enabledTechniques: techniqueIdsFor(discipline, settings.defaultLevel),
        countInSeconds: settings.defaultCountInSeconds,
      },
      { source: 'quick' },
    );
  };

  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="animate-fade-up">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="accent">
            <span className="size-1.5 rounded-full bg-accent animate-pulse-soft" />
            Local-first striking studio
          </Chip>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-mist-dim">
            {new Intl.DateTimeFormat(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            }).format(new Date())}
          </span>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-[62px] font-semibold uppercase leading-[0.78] tracking-[-0.01em] text-paper sm:text-[92px] lg:text-[106px]">
              Sharpen
              <br />
              <span className="text-accent">the art.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-mist sm:text-[15px]">
              Boxing, kickboxing, and Muay Thai. Build the session, hear the combinations,
              and put the work in — online or off.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-[330px]">
            <StatTile value={String(weekTotals.sessions)} label="Sessions" hint="this week" />
            <StatTile value={String(weekTotals.rounds)} label="Rounds" hint="this week" />
            <StatTile
              value={weekTotals.trainingSeconds ? formatDuration(weekTotals.trainingSeconds, { compact: true }) : '0m'}
              label="Time"
              hint="this week"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[28px] border border-accent/20 bg-panel/45 p-5 animate-fade-up sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                Quick start
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-semibold uppercase leading-none tracking-[0.01em] sm:text-4xl">
                Straight to work.
              </h2>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-soft px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist transition-colors hover:border-line-bright hover:text-paper"
            >
              <SlidersHorizontal className="size-3.5" />
              Defaults
            </Link>
          </div>

          <div className="mt-5 max-w-lg">
            <Segmented
              options={DISCIPLINES.map((item) => ({ value: item, label: DISCIPLINE_LABELS[item] }))}
              value={discipline}
              onChange={setDiscipline}
              label="Discipline"
            />
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-ink-soft/80">
            <Metric value={String(preset.rounds)} label="Rounds" />
            <Metric value={formatRoundLength(preset.roundSeconds)} label="Round" />
            <Metric value={formatRoundLength(preset.restSeconds)} label="Rest" />
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button size="lg" onClick={start} icon={<Play className="size-5 fill-current" />} className="w-full sm:w-auto sm:min-w-52">
              Start session
            </Button>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors',
                    preset.id === item.id
                      ? 'border-accent/40 bg-accent/10 text-accent-bright'
                      : 'border-line bg-transparent text-mist-dim hover:border-line-bright hover:text-mist',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-mist-dim">
            <span className="inline-flex items-center gap-1.5">
              <Swords className="size-3.5 text-accent/80" />
              {settings.defaultStance === 'orthodox' ? 'Orthodox' : 'Southpaw'} ·{' '}
              {settings.defaultLevel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="size-3.5 text-accent/80" />
              Spoken callouts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <WifiOff className="size-3.5 text-accent/80" />
              Works offline
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <FeatureCard
          to="/setup"
          icon={<Dumbbell className="size-5" />}
          kicker="Custom session"
          title="Build your round"
          copy="Rounds, stance, focus, and the exact techniques you want to throw."
        />
        <FeatureCard
          to="/combos"
          icon={<Layers3 className="size-5" />}
          kicker={`${libraryCount} combinations`}
          title="Open the library"
          copy="Curated flows, favorites, and your own custom sequences."
          meta={`${favorites.length} saved`}
        />
        <FeatureCard
          to="/ai"
          icon={<Sparkles className="size-5" />}
          kicker="AI coach"
          title="Generate a batch"
          copy="Validated combinations and full plans from the Nemotron coach."
          meta="Fallback ready"
        />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.04em]">
              Recent work
            </h2>
            <p className="mt-0.5 text-xs text-mist-dim">
              {allTotals.sessions > 0
                ? `${allTotals.sessions} sessions · ${allTotals.rounds} rounds all time`
                : 'Your training log starts with the first bell.'}
            </p>
          </div>
          {sessions.length > 0 ? (
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-bright"
            >
              All history <ChevronRight className="size-3.5" />
            </Link>
          ) : null}
        </div>

        {recent.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {recent.map((session) => (
              <SessionCard key={session.id} session={session} stance={session.stance} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-line bg-panel/25 px-5 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-panel text-mist-dim">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-paper">No sessions logged yet</p>
                <p className="mt-0.5 text-xs text-mist-dim">
                  Finish a session and the rounds, time, and callouts land here.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={start} icon={<Clock3 className="size-3.5" />}>
              Start the first
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-3.5 text-center sm:px-4">
      <p className="font-display text-2xl font-semibold leading-none tabular-nums text-paper">
        {value}
      </p>
      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
        {label}
      </p>
    </div>
  );
}

function FeatureCard({
  to,
  icon,
  kicker,
  title,
  copy,
  meta,
}: {
  to: string;
  icon: React.ReactNode;
  kicker: string;
  title: string;
  copy: string;
  meta?: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-2xl border border-line bg-panel/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-bright hover:bg-panel/70"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-ink-soft text-accent">
          {icon}
        </span>
        <ArrowUpRight className="size-4 text-mist-dim transition-colors group-hover:text-accent" />
      </div>
      <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
        {kicker}
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold uppercase leading-none tracking-[0.02em] text-paper">
        {title}
      </h3>
      <p className="mt-2 text-[11px] leading-relaxed text-mist-dim">{copy}</p>
      {meta ? (
        <span className="mt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-mist-dim/70">
          {meta}
        </span>
      ) : null}
    </Link>
  );
}

function safeFocus(focus: Focus, discipline: Discipline): Focus {
  if (focus === 'clinch' && discipline !== 'muay-thai') return 'fundamentals';
  return FOCUSES.includes(focus) ? focus : 'fundamentals';
}

// Keeps focus labels reachable for future home personalization.
export const homeFocusLabels = FOCUS_LABELS;
