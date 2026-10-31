import { Pencil, Star, Trash2 } from 'lucide-react';
import type { Combination, Stance } from '../../shared/types';
import { FOCUS_LABELS } from '../../shared/types';
import { cn } from '../lib/cn';
import { WindowBar } from './ui';
import { ComboSteps, levelLabel } from './TechniqueSelector';

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
  const sourceCode =
    combination.source === 'ai' ? 'AI' : combination.source === 'custom' ? 'MINE' : undefined;

  return (
    <article
      className={cn(
        'group flex min-w-0 flex-col border transition-colors duration-100',
        muted
          ? 'border-line/70 bg-panel/50'
          : 'border-line bg-panel hover:border-line-bright',
      )}
    >
      <WindowBar
        title={`${levelLabel(combination.level)} / ${FOCUS_LABELS[combination.focus]}`}
        code={sourceCode}
        actions={
          <>
            <button
              type="button"
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={favorite}
              onClick={onToggleFavorite}
              className={cn(
                'grid size-7 place-items-center transition-colors',
                favorite ? 'text-accent' : 'text-mist-dim hover:bg-panel hover:text-paper',
              )}
            >
              <Star className={cn('size-3.5', favorite && 'fill-current')} />
            </button>
            {isEditable && onEdit ? (
              <button
                type="button"
                aria-label="Edit combination"
                onClick={onEdit}
                className="grid size-7 place-items-center text-mist-dim transition-colors hover:bg-panel hover:text-paper"
              >
                <Pencil className="size-3.5" />
              </button>
            ) : null}
            {isEditable && onDelete ? (
              <button
                type="button"
                aria-label="Delete combination"
                onClick={onDelete}
                className="grid size-7 place-items-center text-mist-dim transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <h3 className="truncate font-display text-xl font-semibold uppercase leading-none tracking-[0.02em] text-paper">
          {combination.name}
        </h3>
        <div className="mt-3 border-t border-line pt-3">
          <ComboSteps steps={combination.steps} stance={stance} size="sm" muted={muted} />
        </div>
      </div>
    </article>
  );
}
