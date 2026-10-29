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
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-mist-dim">
            <span className="font-semibold text-paper">{selected.length}</span> of {techniques.length}{' '}
            techniques enabled
          </p>
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : techniques.map((technique) => technique.id))}
            className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-bright transition-colors hover:text-accent"
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
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
                <Icon className="size-3.5" />
                {CATEGORY_LABELS[category]}
                <span className="text-mist-dim/60">({items.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((technique) => {
                  const active = selectedSet.has(technique.id);
                  return (
                    <button
                      key={technique.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(technique.id)}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all duration-150',
                        active
                          ? 'border-accent/35 bg-accent/10 text-paper'
                          : 'border-line bg-panel/40 text-mist-dim hover:border-line-bright hover:text-mist',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-3.5 place-items-center rounded-full border',
                          active ? 'border-accent bg-accent text-ink' : 'border-line-bright',
                        )}
                      >
                        {active ? <Check className="size-2.5" strokeWidth={3} /> : null}
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
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, index) => {
        const technique = TECHNIQUE_BY_ID.get(step);
        return (
          <span key={`${step}-${index}`} className="inline-flex items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border font-medium',
                size === 'sm' ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-[11px]',
                muted
                  ? 'border-line/60 bg-transparent text-mist-dim'
                  : 'border-line bg-ink-soft text-mist',
              )}
            >
              {technique?.number ? (
                <span className="font-display text-[10px] font-bold text-accent">
                  {technique.number}
                </span>
              ) : null}
              {technique ? renderTechniqueName(technique, stance) : step}
            </span>
            {index < steps.length - 1 ? (
              <span className="text-[9px] text-mist-dim/50">→</span>
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
