import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      aria-label="STRIKR home"
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <span className="relative grid size-8 shrink-0 place-items-center border border-accent-deep bg-accent text-ink transition-colors group-hover:bg-accent-bright">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path
            d="M5 20 16.5 4M10 20 21.5 4"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="square"
          />
          <path d="M3.5 20h11" stroke="currentColor" strokeWidth="2.8" />
        </svg>
        <span className="absolute inset-0 border border-ink/20" />
      </span>
      {!compact ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-display text-[23px] font-bold uppercase leading-none tracking-[0.14em] text-paper">
            STRIKR
          </span>
          <span className="mt-1 flex items-center gap-1 font-mono text-[6.5px] font-semibold uppercase tracking-[0.24em] text-mist-dim">
            <span className="h-px w-2.5 bg-accent" />
            Striking system
          </span>
        </span>
      ) : null}
    </Link>
  );
}
