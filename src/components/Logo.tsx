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
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-accent text-ink transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M5 20 16.5 4M10 20 21.5 4"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="square"
          />
          <path d="M3.5 20h11" stroke="currentColor" strokeWidth="2.6" />
        </svg>
        <span className="absolute inset-x-0 bottom-0 h-px bg-ink/30" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[25px] font-bold uppercase leading-none tracking-[0.16em] text-paper">
            STRIKR
          </span>
          <span className="mt-1 text-[7px] font-semibold uppercase tracking-[0.3em] text-mist-dim">
            Striking studio
          </span>
        </span>
      ) : null}
    </Link>
  );
}
