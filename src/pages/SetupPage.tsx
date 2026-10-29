import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock3,
  Play,
  Shield,
  Timer,
  Users,
  Zap,
} from 'lucide-react';
import type { Discipline, Focus, SkillLevel, Stance, WorkoutConfig } from '../../shared/types';
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  FOCUSES,
  FOCUS_LABELS,
  LEVELS,
  STANCES,
} from '../../shared/types';
import {
  availableTechniques,
  techniqueIdsFor,
} from '../../shared/techniques';
import { useSettings } from '../lib/settings-context';
import { useWorkoutSession } from '../lib/workout-context';
import { formatDuration, formatRoundLength } from '../lib/format';
import { cn } from '../lib/cn';
import {
  Button,
  Chip,
  NumberStepper,
  PageHeader,
  Segmented,
} from '../components/ui';
import { TechniqueSelector } from '../components/TechniqueSelector';

const focusOptions = (discipline: Discipline) =>
  FOCUSES.filter((focus) => focus !== 'clinch' || discipline === 'muay-thai');

export function SetupPage() {
  const { settings, updateSettings } = useSettings();
  const { startWorkout } = useWorkoutSession();
  const navigate = useNavigate();

  const [config, setConfig] = useState<WorkoutConfig>(() => {
    const focus = safeFocus(settings.defaultFocus, settings.defaultDiscipline);
    return {
      discipline: settings.defaultDiscipline,
      stance: settings.defaultStance,
      level: settings.defaultLevel,
      rounds: settings.defaultRounds,
      roundSeconds: settings.defaultRoundSeconds,
      restSeconds: settings.defaultRestSeconds,
      focus,
      enabledTechniques: techniqueIdsFor(settings.defaultDiscipline, settings.defaultLevel),
      countInSeconds: settings.defaultCountInSeconds,
    };
  });

  const available = useMemo(
    () => availableTechniques(config.discipline, config.level),
    [config.discipline, config.level],
  );

  const totalSeconds =
    config.rounds * config.roundSeconds +
    Math.max(0, config.rounds - 1) * config.restSeconds +
    config.countInSeconds;

  const canStart = config.enabledTechniques.length >= 2;

  const update = <K extends keyof WorkoutConfig>(key: K, value: WorkoutConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const changeDiscipline = (discipline: Discipline) => {
    setConfig((current) => {
      const focus = safeFocus(current.focus, discipline);
      return {
        ...current,
        discipline,
        focus,
        enabledTechniques: techniqueIdsFor(discipline, current.level),
      };
    });
  };

  const changeLevel = (level: SkillLevel) => {
    setConfig((current) => {
      const allowedIds = new Set(techniqueIdsFor(current.discipline, level));
      const kept = current.enabledTechniques.filter((id) => allowedIds.has(id));
      return {
        ...current,
        level,
        enabledTechniques:
          kept.length >= 2 ? kept : [...allowedIds],
      };
    });
  };

  const changeStance = (stance: Stance) => update('stance', stance);
  const changeFocus = (focus: Focus) => update('focus', focus);

  const start = () => {
    if (!canStart) return;
    updateSettings({
      defaultDiscipline: config.discipline,
      defaultStance: config.stance,
      defaultLevel: config.level,
      defaultRounds: config.rounds,
      defaultRoundSeconds: config.roundSeconds,
      defaultRestSeconds: config.restSeconds,
      defaultFocus: config.focus,
      defaultCountInSeconds: config.countInSeconds,
    });
    startWorkout(config, { source: 'setup' });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Session builder"
        title="Build the work."
        description="Choose the rules of engagement. Everything is prepared before the first bell, so the timer and callouts keep running offline."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="size-3.5" />}
          >
            Back
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
            <StepLabel index="01" title="Discipline & stance" />
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Discipline
                </label>
                <Segmented
                  options={DISCIPLINES.map((item) => ({
                    value: item,
                    label: DISCIPLINE_LABELS[item],
                  }))}
                  value={config.discipline}
                  onChange={changeDiscipline}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                    Stance
                  </label>
                  <Segmented
                    options={STANCES.map((item) => ({
                      value: item,
                      label: item === 'orthodox' ? 'Orthodox' : 'Southpaw',
                    }))}
                    value={config.stance}
                    onChange={changeStance}
                    compact
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                    Skill level
                  </label>
                  <Segmented
                    options={LEVELS.map((item) => ({
                      value: item,
                      label: item.charAt(0).toUpperCase() + item.slice(1),
                    }))}
                    value={config.level}
                    onChange={changeLevel}
                    compact
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
            <StepLabel index="02" title="Session shape" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <NumberStepper
                label="Rounds"
                value={config.rounds}
                onChange={(value) => update('rounds', value)}
                min={1}
                max={20}
              />
              <NumberStepper
                label="Round time"
                value={config.roundSeconds}
                onChange={(value) => update('roundSeconds', value)}
                min={30}
                max={600}
                step={30}
                format={formatRoundLength}
              />
              <NumberStepper
                label="Rest"
                value={config.restSeconds}
                onChange={(value) => update('restSeconds', value)}
                min={0}
                max={180}
                step={15}
                format={formatRoundLength}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[3, 6, 10, 12].map((rounds) => (
                <PresetPill
                  key={rounds}
                  active={config.rounds === rounds}
                  onClick={() => update('rounds', rounds)}
                >
                  {rounds} rounds
                </PresetPill>
              ))}
              <span className="mx-1 h-6 w-px bg-line" />
              {[120, 180, 240, 300].map((seconds) => (
                <PresetPill
                  key={seconds}
                  active={config.roundSeconds === seconds}
                  onClick={() => update('roundSeconds', seconds)}
                >
                  {formatRoundLength(seconds)}
                </PresetPill>
              ))}
              <span className="mx-1 h-6 w-px bg-line" />
              {[0, 30, 60, 90].map((seconds) => (
                <PresetPill
                  key={seconds}
                  active={config.restSeconds === seconds}
                  onClick={() => update('restSeconds', seconds)}
                >
                  {seconds === 0 ? 'No rest' : `${formatRoundLength(seconds)} rest`}
                </PresetPill>
              ))}
            </div>

            <div className="mt-5 grid gap-3 border-t border-line/70 pt-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Training focus
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {focusOptions(config.discipline).map((focus) => (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => changeFocus(focus)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                        config.focus === focus
                          ? 'border-accent/35 bg-accent/10 text-paper'
                          : 'border-line bg-ink-soft text-mist-dim hover:border-line-bright hover:text-mist',
                      )}
                    >
                      {FOCUS_LABELS[focus]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Count-in
                </label>
                <Segmented
                  options={[
                    { value: '0', label: 'Off' },
                    { value: '5', label: '5 sec' },
                    { value: '10', label: '10 sec' },
                  ]}
                  value={String(config.countInSeconds)}
                  onChange={(value) => update('countInSeconds', Number(value))}
                  compact
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <StepLabel index="03" title="Technique scope" />
              <Chip tone={canStart ? 'accent' : 'danger'}>
                {config.enabledTechniques.length} enabled
              </Chip>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-mist-dim">
              Only these techniques will appear in callouts and AI requests. Advanced options
              unlock as the level rises.
            </p>
            <div className="mt-4">
              <TechniqueSelector
                techniques={available}
                selected={config.enabledTechniques}
                onChange={(ids) => update('enabledTechniques', ids)}
                stance={config.stance}
              />
            </div>
            {!canStart ? (
              <p className="mt-3 text-xs text-danger">Enable at least two techniques to start.</p>
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-8">
          <div className="relative overflow-hidden rounded-[24px] border border-accent/20 bg-panel/60 p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                Session plan
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold uppercase leading-none">
                {DISCIPLINE_LABELS[config.discipline]}
              </h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-mist-dim">
                {config.stance} · {config.level} · {FOCUS_LABELS[config.focus]}
              </p>

              <div className="mt-5 space-y-2.5 border-y border-line/70 py-4 text-xs">
                <SummaryRow icon={<Timer className="size-3.5" />} label="Rounds" value={`${config.rounds} × ${formatRoundLength(config.roundSeconds)}`} />
                <SummaryRow icon={<Clock3 className="size-3.5" />} label="Rest" value={config.restSeconds === 0 ? 'None' : formatRoundLength(config.restSeconds)} />
                <SummaryRow icon={<Zap className="size-3.5" />} label="Count-in" value={config.countInSeconds === 0 ? 'Off' : `${config.countInSeconds} sec`} />
                <SummaryRow icon={<Shield className="size-3.5" />} label="Techniques" value={`${config.enabledTechniques.length} enabled`} />
                <SummaryRow icon={<Users className="size-3.5" />} label="Callouts" value="Spoken + on screen" />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                    Total session
                  </p>
                  <p className="font-display text-3xl font-semibold leading-none text-paper">
                    {formatDuration(totalSeconds, { compact: true })}
                  </p>
                </div>
                <Check className="size-5 text-success" />
              </div>

              <Button
                size="lg"
                className="mt-5 w-full"
                onClick={start}
                disabled={!canStart}
                icon={<Play className="size-5 fill-current" />}
              >
                Start session
              </Button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-mist-dim">
                Audio unlocks on start. Your setup becomes the new default.
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-ink-soft/60 px-4 py-3 text-[10px] leading-relaxed text-mist-dim">
            <span className="font-semibold text-mist">Local-first.</span> The timer, combinations,
            and history run on this device. AI is optional.
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-display text-sm font-semibold tabular-nums text-accent">{index}</span>
      <span className="h-px w-5 bg-line-bright" />
      <h2 className="font-display text-xl font-semibold uppercase tracking-[0.04em] text-paper">
        {title}
      </h2>
    </div>
  );
}

function PresetPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
        active
          ? 'border-accent/35 bg-accent/10 text-accent-bright'
          : 'border-line bg-transparent text-mist-dim hover:border-line-bright hover:text-mist',
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-mist-dim">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-mist">{value}</span>
    </div>
  );
}

function safeFocus(focus: Focus, discipline: Discipline): Focus {
  if (focus === 'clinch' && discipline !== 'muay-thai') return 'fundamentals';
  return focus;
}
