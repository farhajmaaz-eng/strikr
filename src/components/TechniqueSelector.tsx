import { Check, Dumbbell, Footprints, Hand, Shield, ShieldAlert, Swords, Wind } from 'lucide-react';
import type {
  Discipline,
  SkillLevel,
  Stance,
  Technique,
  TechniqueCategory,
} from '../../shared/types';
import { CATEGORY_LABELS, TECHNIQUE_CATEGORIES } from '../../shared/types';
import { TECHNIQUE_BY_ID, renderTechniqueName } from '../../shared/techniques';
import { cn } from '../lib/cn';

const categoryIcons: Record<TechniqueCategory, typeof Swords> = {
  punch: Hand,
  kick: Footprints,
  knee: Dumbbell,
  elbow: Swords,
  defense: Shield,
  movement: Wind,
  clinch: ShieldAlert,
};

export function TechniqueSelector({
  techniques,
  selected,
  onChange,
  stance,
  showActions = true,
}: {
  techniques: Technique[];
  selected: string[];
  onChange: (ids: string[]) => void;
  stance: Stance;
  showActions?: boolean;
}) {
  const selectedSet = new Set(selected);
  const allSelected = techniques.length > 0 && techniques.every((technique) => selectedSet.has(technique.id));

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      {showActions ? (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-mist-dim">
            <span className="font-semibold text-paper">{selected.length}</span> / {techniques.length} enabled
          </p>
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : techniques.map((technique) => technique.id))}
            className="border border-line bg-ink-soft px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-accent-bright transition-colors hover:border-accent hover:text-paper"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>
      ) : null}
      <div className="space-y-4">
        {TECHNIQUE_CATEGORIES.map((category) => {
          const items = techniques.filter((technique) => technique.category === category);
          if (items.length === 0) return null;
          const Icon = categoryIcons[category];
          return (
            <div key={category}>
              <div className="mb-2 flex items-center gap-1.5">
                <Icon className="size-3 text-accent" />
                <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[8px] tabular-nums text-mist-dim/70">{items.length}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {items.map((technique) => {
                  const active = selectedSet.has(technique.id);
                  return (
                    <button
                      key={technique.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(technique.id)}
                      className={cn(
                        'inline-flex min-h-8 items-center gap-1.5 border px-2 text-[10px] font-medium transition-colors duration-100',
                        active
                          ? 'border-accent bg-accent/12 text-paper'
                          : 'border-line bg-ink-soft text-mist-dim hover:border-line-bright hover:text-mist',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-3 shrink-0 place-items-center border',
                          active ? 'border-accent bg-accent text-ink' : 'border-line-bright',
                        )}
                      >
                        {active ? <Check className="size-2" strokeWidth={3.5} /> : null}
                      </span>
                      {renderTechniqueName(technique, stance)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ComboSteps({
  steps,
  stance,
  size = 'md',
  muted = false,
}: {
  steps: string[];
  stance: Stance;
  size?: 'sm' | 'md';
  muted?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((step, index) => {
        const technique = TECHNIQUE_BY_ID.get(step);
        return (
          <span key={`${step}-${index}`} className="inline-flex items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 border font-medium',
                size === 'sm' ? 'px-1.5 py-1 text-[9px]' : 'px-2 py-1.5 text-[10px]',
                muted
                  ? 'border-line/70 bg-transparent text-mist-dim'
                  : 'border-line bg-ink-soft text-mist',
              )}
            >
              {technique?.number ? (
                <span className="border-r border-line pr-1 font-mono text-[8px] font-bold tabular-nums text-accent">
                  {technique.number}
                </span>
              ) : null}
              {technique ? renderTechniqueName(technique, stance) : step}
            </span>
            {index < steps.length - 1 ? (
              <span className="font-mono text-[8px] text-mist-dim/50">→</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function disciplineLabel(discipline: Discipline): string {
  return discipline === 'muay-thai' ? 'Muay Thai' : discipline === 'kickboxing' ? 'Kickboxing' : 'Boxing';
}

export function levelLabel(level: SkillLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
