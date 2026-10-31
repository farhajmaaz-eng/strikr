import { useState } from 'react';
import { ChevronDown, Clock3, Trash2 } from 'lucide-react';
import type { CompletedSession, Stance } from '../../shared/types';
import { DISCIPLINE_LABELS, FOCUS_LABELS } from '../../shared/types';
import { cn } from '../lib/cn';
import { formatDate, formatDuration, formatRoundLength, formatTimeOfDay } from '../lib/format';
import { WindowBar } from './ui';
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
    <article className="min-w-0 overflow-hidden border border-line bg-panel">
      <WindowBar
        title={`${formatDate(session.completedAt)} / ${formatTimeOfDay(session.completedAt)}`}
        code={session.endedEarly ? 'ABORTED' : 'LOGGED'}
        actions={
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Hide session details' : 'Show session details'}
            aria-expanded={open}
            className="grid size-7 place-items-center text-mist-dim transition-colors hover:bg-panel hover:text-paper"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        }
      />
      <div className="flex items-start gap-3 p-3.5">
        <div className="grid size-9 shrink-0 place-items-center border border-line bg-ink-soft">
          <span className="font-display text-base font-bold uppercase text-accent">
            {DISCIPLINE_LABELS[session.discipline].slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-lg font-semibold uppercase leading-none tracking-[0.02em] text-paper">
              {DISCIPLINE_LABELS[session.discipline]}
            </h3>
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-mist-dim">
              {levelLabel(session.level)}
            </span>
            {session.endedEarly ? (
              <span className="border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-accent">
                Ended early
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-mist-dim">
            {FOCUS_LABELS[session.focus]} / {session.stance === 'orthodox' ? 'Orthodox' : 'Southpaw'}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] text-mist">
            <span>
              <span className="font-semibold text-paper">
                {session.roundsCompleted}/{session.roundsPlanned}
              </span>{' '}
              rounds
            </span>
            <span className="text-mist-dim">{formatRoundLength(session.roundSeconds)} work</span>
            <span className="text-mist-dim">{formatRoundLength(session.restSeconds)} rest</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3 text-mist-dim" />
              {formatDuration(session.trainingSeconds, { compact: true })}
            </span>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-ink-soft px-3.5 py-3.5">
          <div className="mb-3 flex items-center justify-between">
            <p className="meta-label">Callouts ({session.combinations.length})</p>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-mist-dim transition-colors hover:text-danger"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            ) : null}
          </div>
          {session.combinations.length === 0 ? (
            <p className="font-mono text-[10px] text-mist-dim">No callouts were logged for this session.</p>
          ) : (
            <div className="space-y-2.5">
              {session.combinations.map((combination, index) => (
                <div key={`${combination.name}-${index}`} className="flex items-start gap-2.5">
                  <span className="mt-0.5 border border-line bg-panel px-1 py-0.5 font-mono text-[8px] font-semibold tabular-nums text-accent">
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
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.06em] text-mist-dim">
              Skipped: {session.skippedRounds.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
