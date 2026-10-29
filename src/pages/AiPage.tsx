import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  CloudOff,
  Loader2,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type {
  AiPlan,
  Combination,
  Discipline,
  Focus,
  SkillLevel,
  Stance,
  WorkoutConfig,
} from '../../shared/types';
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  FOCUSES,
  FOCUS_LABELS,
  LEVELS,
} from '../../shared/types';
import {
  availableTechniques,
  isTechniqueAvailable,
  TECHNIQUE_BY_ID,
  techniqueIdsFor,
} from '../../shared/techniques';
import { combinationSignature } from '../../shared/combinations';
import { generateWithAi, AiClientError } from '../lib/ai';
import { fallbackCombinations } from '../lib/combinations';
import { useData } from '../lib/data-context';
import { useSettings } from '../lib/settings-context';
import { useWorkoutSession } from '../lib/workout-context';
import { createId } from '../lib/id';
import { formatDuration, formatRoundLength } from '../lib/format';
import { cn } from '../lib/cn';
import {
  Button,
  Chip,
  InlineError,
  PageHeader,
  RangeInput,
  Segmented,
} from '../components/ui';
import { ComboSteps, TechniqueSelector } from '../components/TechniqueSelector';
import { useToast } from '../components/Toast';

type GenerationMode = 'combinations' | 'plan';

interface GenerationContext {
  discipline: Discipline;
  stance: Stance;
  level: SkillLevel;
  focus: Focus;
  scope: string[];
  rounds: number;
  roundSeconds: number;
  restSeconds: number;
  countInSeconds: number;
}

interface GenerationView {
  origin: 'ai' | 'fallback';
  mode: GenerationMode;
  combos: Combination[];
  plan?: AiPlan;
  rejected: number;
  context: GenerationContext;
}

const focusOptions = (discipline: Discipline) =>
  FOCUSES.filter((focus) => focus !== 'clinch' || discipline === 'muay-thai');

export function AiPage() {
  const { settings } = useSettings();
  const { addCombinations } = useData();
  const { startWorkout } = useWorkoutSession();
  const { toast } = useToast();

  const [mode, setMode] = useState<GenerationMode>('combinations');
  const [discipline, setDiscipline] = useState<Discipline>(settings.defaultDiscipline);
  const [stance, setStance] = useState<Stance>(settings.defaultStance);
  const [level, setLevel] = useState<SkillLevel>(settings.defaultLevel);
  const [focus, setFocus] = useState<Focus>(
    safeFocus(settings.defaultFocus, settings.defaultDiscipline),
  );
  const [count, setCount] = useState(8);
  const [scope, setScope] = useState<string[]>(() =>
    techniqueIdsFor(settings.defaultDiscipline, settings.defaultLevel),
  );
  const [scopeOpen, setScopeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationView | null>(null);
  const [fallback, setFallback] = useState<GenerationView | null>(null);

  const techniques = useMemo(() => availableTechniques(discipline, level), [discipline, level]);
  const canGenerate = scope.length >= 2 && !loading;

  const changeDiscipline = (next: Discipline) => {
    setDiscipline(next);
    setFocus((current) => safeFocus(current, next));
    setScope(techniqueIdsFor(next, level));
  };

  const changeLevel = (next: SkillLevel) => {
    setLevel(next);
    const allowed = new Set(techniqueIdsFor(discipline, next));
    setScope((current) => {
      const kept = current.filter((id) => allowed.has(id));
      return kept.length >= 2 ? kept : [...allowed];
    });
  };

  const buildContext = (): GenerationContext => ({
    discipline,
    stance,
    level,
    focus,
    scope: [...scope],
    rounds: settings.defaultRounds,
    roundSeconds: settings.defaultRoundSeconds,
    restSeconds: settings.defaultRestSeconds,
    countInSeconds: settings.defaultCountInSeconds,
  });

  const contextToConfig = (context: GenerationContext): WorkoutConfig => ({
    discipline: context.discipline,
    stance: context.stance,
    level: context.level,
    focus: context.focus,
    rounds: context.rounds,
    roundSeconds: context.roundSeconds,
    restSeconds: context.restSeconds,
    enabledTechniques: context.scope,
    countInSeconds: context.countInSeconds,
  });

  const generate = async () => {
    if (!canGenerate) return;
    const context = buildContext();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const combos = fallbackCombinations(contextToConfig(context), 6);
      setError('You are offline. The AI coach is unavailable, but curated combinations are ready.');
      setResult(null);
      setFallback({ origin: 'fallback', mode: 'combinations', combos, rejected: 0, context });
      return;
    }

    setLoading(true);
    setError(null);
    setFallback(null);
    setResult(null);

    try {
      const response = await generateWithAi({
        mode,
        discipline: context.discipline,
        stance: context.stance,
        level: context.level,
        focus: context.focus,
        count,
        allowedTechniques: context.scope,
        planSettings:
          mode === 'plan'
            ? {
                rounds: context.rounds,
                roundSeconds: context.roundSeconds,
                restSeconds: context.restSeconds,
              }
            : undefined,
      });

      if (response.mode === 'combinations') {
        const combos = mapAiCombinations(response.combinations, context);
        if (combos.length === 0) throw new Error('The AI batch did not contain usable combinations.');
        setResult({
          origin: 'ai',
          mode: 'combinations',
          combos,
          rejected: response.rejected,
          context,
        });
      } else {
        const combos = mapAiCombinations(response.plan.combinations, context);
        if (combos.length < 2) throw new Error('The AI plan did not contain usable combinations.');
        setResult({
          origin: 'ai',
          mode: 'plan',
          combos,
          plan: response.plan,
          rejected: response.rejected,
          context,
        });
      }
    } catch (caught) {
      const message =
        caught instanceof AiClientError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : 'The AI coach could not generate a session.';
      setError(message);
      const combos = fallbackCombinations(contextToConfig(context), 6);
      setFallback({ origin: 'fallback', mode: 'combinations', combos, rejected: 0, context });
    } finally {
      setLoading(false);
    }
  };

  const saveCombos = (view: GenerationView) => {
    const added = addCombinations(view.combos);
    if (added > 0) {
      toast(
        `${added} combination${added === 1 ? '' : 's'} saved to your library.`,
        'success',
      );
    } else {
      toast('Those sequences are already in your library.', 'info');
    }
  };

  const trainView = (view: GenerationView) => {
    const config = contextToConfig(view.context);
    if (view.mode === 'plan' && view.plan) {
      startWorkout(
        {
          ...config,
          focus: view.plan.focus,
          rounds: view.plan.rounds,
          roundSeconds: view.plan.roundSeconds,
          restSeconds: view.plan.restSeconds,
        },
        {
          source: 'ai',
          title: view.plan.title,
          extraCombinations: view.combos,
          callouts: view.combos,
        },
      );
      return;
    }

    startWorkout(config, {
      source: 'ai',
      title: view.origin === 'fallback' ? 'Curated fallback' : 'AI combination batch',
      extraCombinations: view.combos,
      callouts: view.combos,
    });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="AI lab · Requesty"
        title="Build a batch."
        description="Generate validated combinations or a full session plan with Nemotron. Everything is checked against your technique scope before it reaches the floor."
        actions={
          <Chip tone="accent">
            <Sparkles className="size-3" />
            Nemotron 3.5 Lightning
          </Chip>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <section className="rounded-2xl border border-line bg-panel/45 p-5 sm:p-6 lg:sticky lg:top-8">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Generate
              </label>
              <Segmented
                options={[
                  { value: 'combinations', label: 'Combinations' },
                  { value: 'plan', label: 'Workout plan' },
                ]}
                value={mode}
                onChange={setMode}
                compact
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Discipline
              </label>
              <Segmented
                options={DISCIPLINES.map((item) => ({
                  value: item,
                  label: DISCIPLINE_LABELS[item],
                }))}
                value={discipline}
                onChange={changeDiscipline}
                compact
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Stance
                </label>
                <select
                  className="field-input"
                  value={stance}
                  onChange={(event) => setStance(event.target.value as Stance)}
                >
                  <option value="orthodox">Orthodox</option>
                  <option value="southpaw">Southpaw</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                  Level
                </label>
                <select
                  className="field-input"
                  value={level}
                  onChange={(event) => changeLevel(event.target.value as SkillLevel)}
                >
                  {LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                Focus
              </label>
              <div className="flex flex-wrap gap-1.5">
                {focusOptions(discipline).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFocus(item)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                      focus === item
                        ? 'border-accent/35 bg-accent/10 text-paper'
                        : 'border-line bg-ink-soft text-mist-dim hover:border-line-bright hover:text-mist',
                    )}
                  >
                    {FOCUS_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            <RangeInput
              value={count}
              min={3}
              max={12}
              step={1}
              onChange={setCount}
              label="Batch size"
              display={`${count} combos`}
            />

            <div className="rounded-xl border border-line bg-ink-soft">
              <button
                type="button"
                onClick={() => setScopeOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-paper">Technique scope</p>
                  <p className="mt-0.5 text-[10px] text-mist-dim">
                    {scope.length} of {techniques.length} enabled
                  </p>
                </div>
                <ChevronDown
                  className={cn('size-4 text-mist-dim transition-transform', scopeOpen && 'rotate-180')}
                />
              </button>
              {scopeOpen ? (
                <div className="border-t border-line/70 px-3.5 py-4">
                  <TechniqueSelector
                    techniques={techniques}
                    selected={scope}
                    onChange={setScope}
                    stance={stance}
                  />
                </div>
              ) : null}
            </div>

            {scope.length < 2 ? (
              <InlineError>Enable at least two techniques for the AI coach.</InlineError>
            ) : null}

            <Button
              size="lg"
              className="w-full"
              onClick={generate}
              disabled={!canGenerate}
              loading={loading}
              icon={<Wand2 className="size-4" />}
            >
              {loading ? 'Generating…' : mode === 'plan' ? 'Generate plan' : 'Generate combos'}
            </Button>

            <div className="flex items-start gap-2 rounded-xl border border-line/70 bg-ink-soft/60 p-3 text-[10px] leading-relaxed text-mist-dim">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
              Runs server-side through Requesty. The API key never reaches your browser, and
              disallowed technique IDs are rejected.
            </div>
          </div>
        </section>

        <section className="min-w-0">
          {loading ? <LoadingPanel /> : null}

          {!loading && result ? (
            <ResultPanel
              view={result}
              onSave={() => saveCombos(result)}
              onTrain={() => trainView(result)}
              onRegenerate={generate}
            />
          ) : null}

          {!loading && !result && error && fallback ? (
            <FallbackPanel
              error={error}
              view={fallback}
              onRetry={generate}
              onSave={() => saveCombos(fallback)}
              onTrain={() => trainView(fallback)}
            />
          ) : null}

          {!loading && !result && !error ? <StandbyPanel mode={mode} /> : null}
        </section>
      </div>
    </div>
  );
}

function ResultPanel({
  view,
  onSave,
  onTrain,
  onRegenerate,
}: {
  view: GenerationView;
  onSave: () => void;
  onTrain: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="success">
              <ShieldCheck className="size-3" />
              Validated
            </Chip>
            {view.mode === 'plan' ? <Chip tone="accent">Session plan</Chip> : null}
            {view.rejected > 0 ? (
              <span className="text-[10px] text-mist-dim">
                {view.rejected} invalid suggestion{view.rejected === 1 ? '' : 's'} filtered
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold uppercase leading-none tracking-[0.02em]">
            {view.plan?.title ?? 'Your new batch.'}
          </h2>
          <p className="mt-1.5 text-[11px] text-mist-dim">
            {DISCIPLINE_LABELS[view.context.discipline]} · {view.context.stance} ·{' '}
            {view.context.level} · {FOCUS_LABELS[view.plan?.focus ?? view.context.focus]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSave} icon={<Save className="size-3.5" />}>
            Save all
          </Button>
          <Button size="sm" onClick={onTrain} icon={<Play className="size-3.5 fill-current" />}>
            Train
          </Button>
        </div>
      </div>

      {view.plan ? (
        <div className="mt-4 rounded-xl border border-line bg-ink-soft p-3.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <PlanMetric value={String(view.plan.rounds)} label="Rounds" />
            <PlanMetric value={formatRoundLength(view.plan.roundSeconds)} label="Round" />
            <PlanMetric
              value={view.plan.restSeconds ? formatRoundLength(view.plan.restSeconds) : 'None'}
              label="Rest"
            />
          </div>
          {view.plan.notes ? (
            <p className="mt-3 border-t border-line/70 pt-3 text-[11px] leading-relaxed text-mist">
              {view.plan.notes}
            </p>
          ) : null}
          <p className="mt-2 text-[10px] text-mist-dim">
            Total work: {formatDuration((view.plan.rounds * view.plan.roundSeconds) / 1, { compact: true })}
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {view.combos.map((combination, index) => (
          <div key={combination.id} className="rounded-xl border border-line bg-ink-soft/70 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-display text-sm font-semibold tabular-nums text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-paper">
                {combination.name}
              </p>
              <span className="text-[9px] uppercase tracking-[0.1em] text-mist-dim">
                {FOCUS_LABELS[combination.focus]}
              </span>
            </div>
            <ComboSteps steps={combination.steps} stance={view.context.stance} size="sm" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-mist-dim">
          Generated before the workout. The timer runs locally with no further API calls.
        </p>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-mist-dim hover:text-paper"
        >
          <RefreshCw className="size-3" /> Regenerate
        </button>
      </div>
    </div>
  );
}

function FallbackPanel({
  error,
  view,
  onRetry,
  onSave,
  onTrain,
}: {
  error: string;
  view: GenerationView;
  onRetry: () => void;
  onSave: () => void;
  onTrain: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <CloudOff className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-paper">AI is off the table. Training is not.</p>
            <p className="mt-1 text-xs leading-relaxed text-mist">{error}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onTrain} icon={<Play className="size-3.5 fill-current" />}>
            Train with fallback
          </Button>
          <Button variant="secondary" size="sm" onClick={onSave} icon={<Save className="size-3.5" />}>
            Save fallback
          </Button>
          <Button variant="ghost" size="sm" onClick={onRetry} icon={<RefreshCw className="size-3.5" />}>
            Try again
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Chip tone="muted">Curated fallback</Chip>
          <span className="text-[10px] text-mist-dim">Available offline</span>
        </div>
        <div className="space-y-2">
          {view.combos.map((combination, index) => (
            <div key={combination.id} className="rounded-xl border border-line bg-ink-soft/70 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-display text-sm font-semibold tabular-nums text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="flex-1 truncate text-xs font-semibold text-paper">{combination.name}</p>
              </div>
              <ComboSteps steps={combination.steps} stance={view.context.stance} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StandbyPanel({ mode }: { mode: GenerationMode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-panel/35 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/8 blur-3xl" />
      <div className="relative">
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-ink-soft text-accent">
          <Sparkles className="size-5" />
        </span>
        <h2 className="mt-5 font-display text-3xl font-semibold uppercase leading-none tracking-[0.01em]">
          Coach on standby.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-mist">
          {mode === 'plan'
            ? 'Set the fighter, focus, and batch size. The coach returns a complete plan with rounds, rest, coaching notes, and validated combinations.'
            : 'Set the fighter, focus, and batch size. The coach returns a batch of practical combinations to save, train, or keep as a sparring reference.'}
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Guardrail number="01" title="Scoped" copy="Only techniques you enabled are allowed." />
          <Guardrail number="02" title="Validated" copy="Unknown IDs and bad JSON are rejected." />
          <Guardrail number="03" title="Local timer" copy="Generated before the bell, never during." />
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-ink-soft/60 p-3 text-[11px] text-mist-dim">
          <ArrowRight className="size-3.5 shrink-0 text-accent" />
          Pick a preset and generate. The first request usually takes 10–20 seconds.
        </div>
      </div>
    </div>
  );
}

function Guardrail({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft/60 p-3">
      <p className="font-display text-sm font-semibold tabular-nums text-accent">{number}</p>
      <p className="mt-1 text-[11px] font-semibold text-paper">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-mist-dim">{copy}</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-2xl border border-line bg-panel/35 p-8 text-center">
      <div className="relative grid size-16 place-items-center">
        <span className="absolute inset-0 rounded-full border border-accent/20 animate-ping" />
        <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Loader2 className="size-5 animate-spin" />
        </span>
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold uppercase tracking-[0.02em]">
        Reading the room.
      </h2>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-mist-dim">
        Building combinations, checking every technique against your scope, and rejecting anything
        that does not fit.
      </p>
      <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
        <AlertTriangle className="size-3.5 text-accent" />
        Please keep this tab open
      </div>
    </div>
  );
}

function PlanMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold leading-none tabular-nums text-paper">{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist-dim">{label}</p>
    </div>
  );
}

function mapAiCombinations(
  raw: { name: string; steps: string[]; focus?: Focus; level?: SkillLevel }[],
  context: GenerationContext,
): Combination[] {
  const allowed = new Set(context.scope);
  const seen = new Set<string>();
  const result: Combination[] = [];

  for (const item of raw) {
    if (!item.steps.every((step) => allowed.has(step))) continue;
    if (
      !item.steps.every((step) => {
        const technique = TECHNIQUE_BY_ID.get(step);
        return Boolean(
          technique && isTechniqueAvailable(technique, context.discipline, context.level),
        );
      })
    ) {
      continue;
    }
    const signature = combinationSignature(item.steps);
    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push({
      id: createId('ai'),
      name: item.name.slice(0, 70),
      steps: [...item.steps],
      discipline: context.discipline,
      level: item.level ?? context.level,
      focus: item.focus ?? context.focus,
      source: 'ai',
      createdAt: new Date().toISOString(),
    });
  }

  return result;
}

function safeFocus(focus: Focus, discipline: Discipline): Focus {
  if (focus === 'clinch' && discipline !== 'muay-thai') return 'fundamentals';
  return focus;
}
