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
import { Button, Segmented, StatTile, WindowBar, WindowFrame } from '../components/ui';
import { SessionCard } from '../components/SessionCard';

interface QuickPreset {
  id: string;
  label: string;
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
}

const presets: QuickPreset[] = [
  { id: 'quick', label: 'Quick', rounds: 3, roundSeconds: 120, restSeconds: 60 },
  { id: 'standard', label: 'Standard', rounds: 6, roundSeconds: 180, restSeconds: 60 },
  { id: 'camp', label: 'Camp', rounds: 10, roundSeconds: 180, restSeconds: 60 },
  { id: 'conditioning', label: 'Conditioning', rounds: 8, roundSeconds: 120, restSeconds: 30 },
];

export function HomePage() {
  const { settings } = useSettings();
  const { sessions, customCombinations, favorites } = useData();
  const { startWorkout } = useWorkoutSession();
  const [discipline, setDiscipline] = useState<Discipline>(settings.defaultDiscipline);
  const [preset, setPreset] = useState<QuickPreset | null>(() => {
    return (
      presets.find(
        (item) =>
          item.rounds === settings.defaultRounds &&
          item.roundSeconds === settings.defaultRoundSeconds &&
          item.restSeconds === settings.defaultRestSeconds,
      ) ?? null
    );
  });
  const activePreset: QuickPreset =
    preset ?? {
      id: 'defaults',
      label: 'My defaults',
      rounds: settings.defaultRounds,
      roundSeconds: settings.defaultRoundSeconds,
      restSeconds: settings.defaultRestSeconds,
    };

  const weekSessions = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const weekTotals = useMemo(() => totalsFor(weekSessions), [weekSessions]);
  const allTotals = useMemo(() => totalsFor(sessions), [sessions]);
  const recent = sessions.slice(0, 2);
  const libraryCount = CURATED_COMBINATIONS.length + customCombinations.length;
  const focus = safeFocus(settings.defaultFocus, discipline);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(new Date());

  const start = () => {
    startWorkout(
      {
        discipline,
        stance: settings.defaultStance,
        level: settings.defaultLevel,
        rounds: activePreset.rounds,
        roundSeconds: activePreset.roundSeconds,
        restSeconds: activePreset.restSeconds,
        focus,
        enabledTechniques: techniqueIdsFor(discipline, settings.defaultLevel),
        countInSeconds: settings.defaultCountInSeconds,
      },
      { source: 'quick' },
    );
  };

  return (
    <div className="space-y-3 animate-fade-up">
      <section className="window-panel">
        <WindowBar title="strikr :: training console" code="HOME / 01" />
        <div className="grid lg:grid-cols-[1.55fr_1fr]">
          <div className="border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[9px] uppercase tracking-[0.1em]">
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="status-dot" />
                Local-first striking studio
              </span>
              <span className="text-mist-dim/50">/</span>
              <span className="text-mist-dim">{dateLabel}</span>
            </div>

            <h1 className="mt-5 font-display text-[64px] font-semibold uppercase leading-[0.76] tracking-[-0.01em] text-paper sm:text-[88px]">
              Sharpen
              <br />
              <span className="text-accent">the art.</span>
            </h1>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-mist sm:text-sm">
              Boxing, kickboxing, and Muay Thai. Build the session, hear the combinations, and put
              the work in. Online or off.
            </p>

            <div className="mt-5 flex flex-wrap gap-1">
              {DISCIPLINES.map((item) => (
                <span
                  key={item}
                  className="border border-line bg-ink-soft px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-mist-dim"
                >
                  {DISCIPLINE_LABELS[item]}
                </span>
              ))}
              <span className="border border-line bg-ink-soft px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-mist-dim">
                No account
              </span>
            </div>
          </div>

          <div className="flex flex-col p-3 sm:p-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <p className="meta-label">Week / telemetry</p>
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-success">
                [ live ]
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <StatTile value={String(weekTotals.sessions)} label="Sessions" hint="this week" />
              <StatTile value={String(weekTotals.rounds)} label="Rounds" hint="this week" />
              <StatTile
                value={
                  weekTotals.trainingSeconds
                    ? formatDuration(weekTotals.trainingSeconds, { compact: true })
                    : '0m'
                }
                label="Time"
                hint="this week"
              />
            </div>

            <div className="mt-3 divide-y divide-line border border-line bg-ink-soft">
              <SignalRow
                label="All-time work"
                value={
                  allTotals.sessions > 0
                    ? `${allTotals.sessions} sessions / ${allTotals.rounds} rounds`
                    : 'No sessions logged'
                }
              />
              <SignalRow
                label="Default build"
                value={`${settings.defaultRounds} × ${formatRoundLength(settings.defaultRoundSeconds)}`}
              />
              <SignalRow
                label="Stance / level"
                value={`${settings.defaultStance} / ${settings.defaultLevel}`}
              />
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-[8px] uppercase tracking-[0.1em] text-mist-dim">
              <span className="inline-flex items-center gap-1.5">
                <WifiOff className="size-3 text-accent" />
                Offline capable
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Swords className="size-3 text-accent" />
                {libraryCount} combos loaded
              </span>
            </div>
          </div>
        </div>
      </section>

      <WindowFrame
        title="quick start"
        code="SES-01"
        actions={
          <Link
            to="/settings"
            className="inline-flex h-7 items-center gap-1 border border-line bg-ink-soft px-2 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-mist transition-colors hover:border-line-bright hover:text-paper"
          >
            <SlidersHorizontal className="size-3" />
            Defaults
          </Link>
        }
      >
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="meta-label">Discipline</p>
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
                mode / {preset ? 'quick' : 'defaults'}
              </span>
            </div>
            <div className="mt-2">
              <Segmented
                options={DISCIPLINES.map((item) => ({ value: item, label: DISCIPLINE_LABELS[item] }))}
                value={discipline}
                onChange={setDiscipline}
                label="Discipline"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 divide-x divide-line border border-line bg-ink-soft">
              <Metric value={String(activePreset.rounds)} label="Rounds" />
              <Metric value={formatRoundLength(activePreset.roundSeconds)} label="Round" />
              <Metric value={formatRoundLength(activePreset.restSeconds)} label="Rest" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4">
              {presets.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item)}
                  aria-pressed={preset?.id === item.id}
                  className={cn(
                    'border px-2.5 py-2 text-left transition-colors duration-100',
                    preset?.id === item.id
                      ? 'border-accent bg-accent text-ink'
                      : 'border-line bg-ink-soft text-mist hover:border-line-bright hover:text-paper',
                  )}
                >
                  <span className="block font-mono text-[8px] font-semibold uppercase tracking-[0.1em] opacity-70">
                    {item.label}
                  </span>
                  <span className="mt-1 block font-display text-lg font-semibold uppercase leading-none">
                    {item.rounds} × {formatRoundLength(item.roundSeconds)}
                  </span>
                </button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={start}
              icon={<Play className="size-4 fill-current" />}
              className="mt-3 w-full"
            >
              Start session
            </Button>
          </div>

          <div className="border-t border-line p-4 sm:p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <p className="meta-label">Session parameters</p>
              <span className="window-code">CFG</span>
            </div>
            <div className="divide-y divide-line">
              <ParameterRow icon={<Swords className="size-3.5" />} label="Stance" value={settings.defaultStance === 'orthodox' ? 'Orthodox' : 'Southpaw'} />
              <ParameterRow icon={<Zap className="size-3.5" />} label="Focus" value={FOCUS_LABELS[focus]} />
              <ParameterRow icon={<Clock3 className="size-3.5" />} label="Count-in" value={settings.defaultCountInSeconds === 0 ? 'Off' : `${settings.defaultCountInSeconds}s`} />
              <ParameterRow icon={<WifiOff className="size-3.5" />} label="Engine" value="On-device" />
            </div>

            <div className="mt-3 border border-accent/40 bg-accent/5 p-2.5">
              <p className="meta-label text-accent">Ready check</p>
              <p className="mt-1 font-display text-xl font-semibold uppercase leading-none text-paper">
                Timer / bells / callouts
              </p>
              <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
                Speech and audio unlock on start.
              </p>
            </div>
          </div>
        </div>
      </WindowFrame>

      <section className="grid gap-3 sm:grid-cols-3">
        <FeatureCard
          to="/setup"
          icon={<Dumbbell className="size-4" />}
          kicker="session"
          code="02"
          title="Build your round"
          copy="Rounds, stance, focus, and the exact techniques in the pool."
        />
        <FeatureCard
          to="/combos"
          icon={<Layers3 className="size-4" />}
          kicker="library"
          code="03"
          title="Open the arsenal"
          copy="Curated flows, favorites, and custom sequences."
          meta={`${libraryCount} total / ${favorites.length} saved`}
        />
        <FeatureCard
          to="/ai"
          icon={<Sparkles className="size-4" />}
          kicker="ai lab"
          code="04"
          title="Generate a batch"
          copy="Scoped combinations and plans with server-side validation."
          meta="Fallback ready"
        />
      </section>

      <WindowFrame title="recent work / local log" code={`${String(sessions.length).padStart(2, '0')} ENTRIES`}>
        <div className="p-3">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-mist-dim">
              {allTotals.sessions > 0
                ? `${allTotals.sessions} sessions / ${allTotals.rounds} rounds stored on this device`
                : 'No entries. The first bell starts the log.'}
            </p>
            {sessions.length > 0 ? (
              <Link
                to="/history"
                className="inline-flex items-center gap-1 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-accent-bright hover:text-accent"
              >
                All history <ChevronRight className="size-3" />
              </Link>
            ) : null}
          </div>

          {recent.length > 0 ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {recent.map((session) => (
                <SessionCard key={session.id} session={session} stance={session.stance} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-3 border border-dashed border-line bg-ink-soft px-4 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center border border-line bg-panel text-mist-dim">
                  <CalendarDays className="size-4" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-paper">
                    No sessions logged yet
                  </p>
                  <p className="mt-1 text-[11px] text-mist-dim">
                    Finish a session and its rounds, time, and callouts land here.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={start} icon={<Clock3 className="size-3" />}>
                Start the first
              </Button>
            </div>
          )}
        </div>
      </WindowFrame>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 py-2">
      <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">{label}</span>
      <span className="truncate text-right font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-mist">
        {value}
      </span>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-2.5 text-center">
      <p className="font-display text-2xl font-semibold leading-none tabular-nums text-paper">
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-mist-dim">
        {label}
      </p>
    </div>
  );
}

function ParameterRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-mist">
        {value}
      </span>
    </div>
  );
}

function FeatureCard({
  to,
  icon,
  kicker,
  code,
  title,
  copy,
  meta,
}: {
  to: string;
  icon: React.ReactNode;
  kicker: string;
  code: string;
  title: string;
  copy: string;
  meta?: string;
}) {
  return (
    <Link to={to} className="group window-panel flex flex-col transition-colors hover:border-line-bright">
      <WindowBar
        title={`module / ${kicker}`}
        code={code}
        actions={<ArrowUpRight className="size-3 text-mist-dim transition-colors group-hover:text-accent" />}
      />
      <div className="flex flex-1 flex-col p-3.5">
        <span className="grid size-8 place-items-center border border-line bg-ink-soft text-accent">
          {icon}
        </span>
        <h3 className="mt-3 font-display text-xl font-semibold uppercase leading-none tracking-[0.02em] text-paper">
          {title}
        </h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-mist-dim">{copy}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5 font-mono text-[8px] uppercase tracking-[0.08em]">
          <span className="text-mist-dim">{meta ?? 'Ready'}</span>
          <span className="text-mist-dim transition-colors group-hover:text-accent">Open →</span>
        </div>
      </div>
    </Link>
  );
}

function safeFocus(focus: Focus, discipline: Discipline): Focus {
  if (focus === 'clinch' && discipline !== 'muay-thai') return 'fundamentals';
  return FOCUSES.includes(focus) ? focus : 'fundamentals';
}

export const homeFocusLabels = FOCUS_LABELS;
