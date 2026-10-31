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
  WindowFrame,
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
        code="SETUP / 01"
        title="Build the work."
        description="Set the rules of engagement before the first bell. The timer, bells, and callouts run locally, including offline."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="size-3" />}
          >
            Back
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
        <div className="space-y-3">
          <WindowFrame title="01 / discipline & stance" code="CFG-01">
            <div className="space-y-4 p-3.5 sm:p-4">
              <div>
                <label className="meta-label mb-1.5 block">Discipline</label>
                <Segmented
                  options={DISCIPLINES.map((item) => ({
                    value: item,
                    label: DISCIPLINE_LABELS[item],
                  }))}
                  value={config.discipline}
                  onChange={changeDiscipline}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="meta-label mb-1.5 block">Stance</label>
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
                  <label className="meta-label mb-1.5 block">Skill level</label>
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
          </WindowFrame>

          <WindowFrame title="02 / session shape" code="CFG-02">
            <div className="p-3.5 sm:p-4">
              <div className="grid gap-2 sm:grid-cols-3">
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

              <div className="mt-3 flex flex-wrap gap-1">
                {[3, 6, 10, 12].map((rounds) => (
                  <PresetButton
                    key={rounds}
                    active={config.rounds === rounds}
                    onClick={() => update('rounds', rounds)}
                  >
                    {rounds}R
                  </PresetButton>
                ))}
                <span className="mx-1 h-6 w-px bg-line" />
                {[120, 180, 240, 300].map((seconds) => (
                  <PresetButton
                    key={seconds}
                    active={config.roundSeconds === seconds}
                    onClick={() => update('roundSeconds', seconds)}
                  >
                    {formatRoundLength(seconds)}
                  </PresetButton>
                ))}
                <span className="mx-1 h-6 w-px bg-line" />
                {[0, 30, 60, 90].map((seconds) => (
                  <PresetButton
                    key={seconds}
                    active={config.restSeconds === seconds}
                    onClick={() => update('restSeconds', seconds)}
                  >
                    {seconds === 0 ? 'No rest' : `${formatRoundLength(seconds)} rest`}
                  </PresetButton>
                ))}
              </div>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <div>
                  <label className="meta-label mb-1.5 block">Training focus</label>
                  <div className="flex flex-wrap gap-1">
                    {focusOptions(config.discipline).map((focus) => (
                      <button
                        key={focus}
                        type="button"
                        onClick={() => changeFocus(focus)}
                        className={cn(
                          'border px-2 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100',
                          config.focus === focus
                            ? 'border-accent bg-accent text-ink'
                            : 'border-line bg-ink-soft text-mist-dim hover:border-line-bright hover:text-paper',
                        )}
                      >
                        {FOCUS_LABELS[focus]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="meta-label mb-1.5 block">Count-in</label>
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
            </div>
          </WindowFrame>

          <WindowFrame
            title="03 / technique scope"
            code="CFG-03"
            actions={<Chip tone={canStart ? 'accent' : 'danger'}>{config.enabledTechniques.length} enabled</Chip>}
          >
            <div className="p-3.5 sm:p-4">
              <p className="mb-4 border-l-2 border-accent bg-ink-soft px-3 py-2 font-mono text-[9px] leading-relaxed tracking-[0.02em] text-mist-dim">
                Only these techniques can appear in callouts or AI requests. Higher levels unlock
                more options.
              </p>
              <TechniqueSelector
                techniques={available}
                selected={config.enabledTechniques}
                onChange={(ids) => update('enabledTechniques', ids)}
                stance={config.stance}
              />
              {!canStart ? (
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-danger">
                  Enable at least two techniques to start.
                </p>
              ) : null}
            </div>
          </WindowFrame>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-12">
          <WindowFrame title="session plan" code="PREVIEW" active>
            <div className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
                <div>
                  <p className="meta-label text-accent">Current build</p>
                  <h2 className="mt-1 font-display text-3xl font-semibold uppercase leading-none">
                    {DISCIPLINE_LABELS[config.discipline]}
                  </h2>
                </div>
                <Check className="size-4 text-success" />
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-mist-dim">
                {config.stance} / {config.level} / {FOCUS_LABELS[config.focus]}
              </p>

              <div className="mt-3 divide-y divide-line border-y border-line">
                <SummaryRow icon={<Timer className="size-3" />} label="Rounds" value={`${config.rounds} × ${formatRoundLength(config.roundSeconds)}`} />
                <SummaryRow icon={<Clock3 className="size-3" />} label="Rest" value={config.restSeconds === 0 ? 'None' : formatRoundLength(config.restSeconds)} />
                <SummaryRow icon={<Zap className="size-3" />} label="Count-in" value={config.countInSeconds === 0 ? 'Off' : `${config.countInSeconds} sec`} />
                <SummaryRow icon={<Shield className="size-3" />} label="Techniques" value={`${config.enabledTechniques.length} enabled`} />
                <SummaryRow icon={<Users className="size-3" />} label="Callouts" value="Spoken + screen" />
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="meta-label">Total session</p>
                  <p className="mt-1 font-display text-3xl font-semibold leading-none text-paper">
                    {formatDuration(totalSeconds, { compact: true })}
                  </p>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
                  estimate
                </span>
              </div>

              <Button
                size="lg"
                className="mt-3 w-full"
                onClick={start}
                disabled={!canStart}
                icon={<Play className="size-4 fill-current" />}
              >
                Start session
              </Button>
              <p className="mt-2 text-center font-mono text-[8px] leading-relaxed uppercase tracking-[0.06em] text-mist-dim">
                Audio unlocks on start / setup becomes the new default
              </p>
            </div>
          </WindowFrame>

          <WindowFrame title="local engine" code="SYS">
            <div className="p-3 font-mono text-[9px] leading-relaxed text-mist-dim">
              <p>
                <span className="font-semibold text-mist">Timer and callouts:</span> on-device.
              </p>
              <p className="mt-1">
                <span className="font-semibold text-mist">History and combos:</span> this browser.
              </p>
              <p className="mt-1">
                <span className="font-semibold text-mist">AI:</span> optional server-side request.
              </p>
            </div>
          </WindowFrame>
        </aside>
      </div>
    </div>
  );
}

function PresetButton({
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
        'border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100',
        active
          ? 'border-accent bg-accent text-ink'
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
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-mist-dim">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <span className="text-right font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-mist">
        {value}
      </span>
    </div>
  );
}

function safeFocus(focus: Focus, discipline: Discipline): Focus {
  if (focus === 'clinch' && discipline !== 'muay-thai') return 'fundamentals';
  return focus;
}
