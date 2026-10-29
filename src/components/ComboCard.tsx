import { Pencil, Star, Trash2 } from 'lucide-react';
import type { Combination, Stance } from '../../shared/types';
import { FOCUS_LABELS } from '../../shared/types';
import { cn } from '../lib/cn';
import { ComboSteps, disciplineLabel, levelLabel } from './TechniqueSelector';

export function ComboCard({
  combination,
  stance,
  favorite,
  onToggleFavorite,
  onEdit,
  onDelete,
  muted = false,
}: {
  combination: Combination;
  stance: Stance;
  favorite: boolean;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  muted?: boolean;
}) {
  const isEditable = combination.source !== 'curated';

  return (
    <article
      className={cn(
        'group rounded-2xl border p-4 transition-all duration-200',
        muted
          ? 'border-line/60 bg-panel/20'
          : 'border-line bg-panel/55 hover:border-line-bright hover:bg-panel',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
              {disciplineLabel(combination.discipline)}
            </span>
            <span className="text-[9px] text-mist-dim/50">/</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-mist-dim">
              {levelLabel(combination.level)}
            </span>
            <span className="text-[9px] text-mist-dim/50">/</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-mist-dim">
              {FOCUS_LABELS[combination.focus]}
            </span>
            {combination.source !== 'curated' ? (
              <span className="rounded-full border border-line px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-mist-dim">
                {combination.source === 'ai' ? 'AI' : 'Custom'}
              </span>
            ) : null}
          </div>
          <h3 className="truncate font-display text-xl font-semibold uppercase leading-none tracking-[0.02em] text-paper">
            {combination.name}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={favorite}
            onClick={onToggleFavorite}
            className={cn(
              'grid size-9 place-items-center rounded-lg transition-colors',
              favorite ? 'text-accent' : 'text-mist-dim hover:bg-panel-raised hover:text-paper',
            )}
          >
            <Star className={cn('size-4', favorite && 'fill-current')} />
          </button>
          {isEditable && onEdit ? (
            <button
              type="button"
              aria-label="Edit combination"
              onClick={onEdit}
              className="grid size-9 place-items-center rounded-lg text-mist-dim transition-colors hover:bg-panel-raised hover:text-paper"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : null}
          {isEditable && onDelete ? (
            <button
              type="button"
              aria-label="Delete combination"
              onClick={onDelete}
              className="grid size-9 place-items-center rounded-lg text-mist-dim transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3">
        <ComboSteps steps={combination.steps} stance={stance} size="sm" muted={muted} />
      </div>
    </article>
  );
}
