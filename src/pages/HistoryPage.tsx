import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CalendarDays, Clock3, Flame, History, Play, Trash2 } from 'lucide-react';
import type { CompletedSession } from '../../shared/types';
import { useData } from '../lib/data-context';
import { useToast } from '../components/Toast';
import { currentStreakDays, sessionsThisWeek, totalsFor } from '../lib/stats';
import { formatDuration } from '../lib/format';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  StatTile,
  WindowFrame,
} from '../components/ui';
import { SessionCard } from '../components/SessionCard';

export function HistoryPage() {
  const { sessions, deleteSession, clearHistory } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<CompletedSession | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const totals = useMemo(() => totalsFor(sessions), [sessions]);
  const week = useMemo(() => totalsFor(sessionsThisWeek(sessions)), [sessions]);
  const streak = useMemo(() => currentStreakDays(sessions), [sessions]);

  const groups = useMemo(() => {
    const map = new Map<string, CompletedSession[]>();
    for (const session of sessions) {
      const date = new Date(session.completedAt);
      const key = Number.isNaN(date.getTime())
        ? 'Unknown'
        : new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [sessions]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSession(deleteTarget.id);
    setDeleteTarget(null);
    toast('Session removed from history.', 'info');
  };

  const confirmClear = () => {
    clearHistory();
    setClearOpen(false);
    toast('Training history cleared.', 'info');
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Training log"
        code="LOG / 04"
        title="The receipts."
        description="Every completed round, stored locally on this device. No account, no cloud, no invented numbers."
        actions={
          sessions.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearOpen(true)}
              icon={<Trash2 className="size-3" />}
            >
              Clear
            </Button>
          ) : undefined
        }
      />

      <WindowFrame title="training totals" code="ALL-TIME" className="mb-3">
        <div className="grid grid-cols-2 gap-1.5 p-2.5 sm:grid-cols-4">
          <StatTile value={String(totals.sessions)} label="Sessions" hint="all time" />
          <StatTile value={String(totals.rounds)} label="Rounds" hint="all time" />
          <StatTile
            value={totals.trainingSeconds ? formatDuration(totals.trainingSeconds, { compact: true }) : '0m'}
            label="Training time"
            hint="all time"
          />
          <StatTile value={`${streak}d`} label="Streak" hint={week.sessions ? `${week.sessions} this week` : 'start today'} />
        </div>
      </WindowFrame>

      {sessions.length === 0 ? (
        <WindowFrame title="session log" code="EMPTY">
          <div className="p-2.5">
            <EmptyState
              icon={<History className="size-4" />}
              title="No history yet"
              description="Complete a session and the rounds, training time, and every callout you heard will be saved here."
              action={
                <Button size="sm" onClick={() => navigate('/setup')} icon={<Play className="size-3 fill-current" />}>
                  Build the first session
                </Button>
              }
            />
          </div>
        </WindowFrame>
      ) : (
        <div className="space-y-4">
          {groups.map(([month, monthSessions]) => (
            <section key={month}>
              <div className="mb-2 flex items-center gap-2 border-b border-line pb-1.5">
                <CalendarDays className="size-3 text-accent" />
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-paper">
                  {month}
                </h2>
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-mist-dim">
                  {monthSessions.length} session{monthSessions.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {monthSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    stance={session.stance}
                    onDelete={() => setDeleteTarget(session)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <WindowFrame title="week signal" code="SYS" className="mt-3">
        <div className="grid gap-0 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Insight
            icon={<Activity className="size-3.5" />}
            label="Average session"
            value={
              totals.sessions > 0
                ? formatDuration(totals.trainingSeconds / totals.sessions, { compact: true })
                : '—'
            }
          />
          <Insight
            icon={<Flame className="size-3.5" />}
            label="Rounds this week"
            value={String(week.rounds)}
          />
          <Insight
            icon={<Clock3 className="size-3.5" />}
            label="Time this week"
            value={week.trainingSeconds ? formatDuration(week.trainingSeconds, { compact: true }) : '0m'}
          />
        </div>
      </WindowFrame>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this session?"
        description="The session, its rounds, and its callouts will be removed from this device."
        confirmLabel="Delete session"
      />

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={confirmClear}
        title="Clear all history?"
        description="Every session stored on this device will be deleted. Your custom combinations and settings stay."
        confirmLabel="Clear history"
      />
    </div>
  );
}

function Insight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <span className="grid size-8 place-items-center border border-line bg-ink-soft text-mist-dim">
        {icon}
      </span>
      <div>
        <p className="meta-label">{label}</p>
        <p className="mt-1 font-display text-lg font-semibold leading-tight text-paper">{value}</p>
      </div>
    </div>
  );
}
