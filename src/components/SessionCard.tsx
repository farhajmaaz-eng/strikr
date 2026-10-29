import { useState } from 'react';
import { ChevronDown, Clock3, Trash2 } from 'lucide-react';
import type { CompletedSession, Stance } from '../../shared/types';
import { DISCIPLINE_LABELS, FOCUS_LABELS } from '../../shared/types';
import { cn } from '../lib/cn';
import { formatDate, formatDuration, formatRoundLength, formatTimeOfDay } from '../lib/format';
import { ComboSteps, levelLabel } from './TechniqueSelector';

export function SessionCard({
  session,
  stance,
  onDelete,
  defaultOpen = false,
}: {
  session: CompletedSession;
  stance: Stance;
  onDelete?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-panel/45">
      <div className="flex items-start gap-3 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-ink-soft">
          <span className="font-display text-lg font-bold uppercase text-accent">
            {DISCIPLINE_LABELS[session.discipline].slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-lg font-semibold uppercase leading-none tracking-[0.02em] text-paper">
              {DISCIPLINE_LABELS[session.discipline]}
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-dim">
              {levelLabel(session.level)}
            </span>
            {session.endedEarly ? (
              <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-accent">
                Ended early
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-mist-dim">
            {formatDate(session.completedAt)} · {formatTimeOfDay(session.completedAt)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-mist">
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-paper">
                {session.roundsCompleted}/{session.roundsPlanned}
              </span>{' '}
              rounds
            </span>
            <span>{formatRoundLength(session.roundSeconds)} rounds</span>
            <span>{formatRoundLength(session.restSeconds)} rest</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3 text-mist-dim" />
              {formatDuration(session.trainingSeconds, { compact: true })}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? 'Hide session details' : 'Show session details'}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-mist-dim transition-colors hover:bg-panel-raised hover:text-paper"
        >
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-line/70 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-dim">
              Callouts ({session.combinations.length})
            </p>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-mist-dim transition-colors hover:text-danger"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            ) : null}
          </div>
          {session.combinations.length === 0 ? (
            <p className="text-xs text-mist-dim">No callouts were logged for this session.</p>
          ) : (
            <div className="space-y-2.5">
              {session.combinations.map((combination, index) => (
                <div key={`${combination.name}-${index}`} className="flex items-start gap-2.5">
                  <span className="mt-1 text-[9px] font-semibold tabular-nums text-mist-dim">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-mist">{combination.name}</p>
                    <div className="mt-1">
                      <ComboSteps steps={combination.steps} stance={stance} size="sm" muted />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {session.skippedRounds.length > 0 ? (
            <p className="mt-3 text-[10px] text-mist-dim">
              Skipped round{session.skippedRounds.length > 1 ? 's' : ''}:{' '}
              {session.skippedRounds.join(', ')}
            </p>
          ) : null}
          <p className="mt-3 text-[10px] text-mist-dim/60">
            {FOCUS_LABELS[session.focus]} ·{' '}
            {session.stance === 'orthodox' ? 'Orthodox' : 'Southpaw'}
          </p>
        </div>
      ) : null}
    </article>
  );
}
