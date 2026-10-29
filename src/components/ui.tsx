import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Minus, Plus, X } from 'lucide-react';
import { cn } from '../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-ink hover:bg-accent-bright active:bg-accent-deep shadow-[0_10px_30px_-12px_rgba(255,77,46,0.65)]',
  secondary:
    'bg-panel text-paper border border-line hover:bg-panel-raised hover:border-line-bright',
  ghost: 'bg-transparent text-mist hover:bg-panel hover:text-paper',
  danger: 'bg-danger/12 text-danger border border-danger/25 hover:bg-danger/20',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-14 px-6 text-[15px] rounded-2xl gap-2.5',
  icon: 'size-11 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        'disabled:pointer-events-none disabled:opacity-40',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid size-10 place-items-center rounded-xl border border-line bg-panel/70 text-mist transition-colors hover:border-line-bright hover:bg-panel-raised hover:text-paper',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[44px] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-paper sm:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.04em] text-paper">
          {title}
        </h2>
        {detail ? <p className="mt-0.5 text-xs text-mist-dim">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  compact = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'grid gap-1 rounded-2xl border border-line bg-ink-soft p-1',
        compact ? 'grid-flow-col auto-cols-fr' : 'grid-flow-col auto-cols-fr',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold transition-all duration-200',
              compact ? 'min-h-9 text-xs' : 'sm:min-h-11',
              active
                ? 'bg-paper text-ink shadow-sm'
                : 'text-mist-dim hover:bg-panel/70 hover:text-paper',
            )}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'danger' | 'muted';
  className?: string;
}) {
  const tones = {
    default: 'border-line bg-panel text-mist',
    accent: 'border-accent/25 bg-accent/10 text-accent-bright',
    success: 'border-success/25 bg-success/10 text-success',
    danger: 'border-danger/25 bg-danger/10 text-danger',
    muted: 'border-line/70 bg-transparent text-mist-dim',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format = (current) => String(current),
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (value: number) => string;
  suffix?: string;
}) {
  const id = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div>
      <label id={id} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
        {label}
      </label>
      <div className="flex h-14 items-center justify-between rounded-2xl border border-line bg-ink-soft px-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="grid size-10 place-items-center rounded-xl text-mist-dim transition-colors hover:bg-panel hover:text-paper disabled:opacity-30"
        >
          <Minus className="size-4" />
        </button>
        <div className="text-center" aria-labelledby={id}>
          <span className="font-display text-2xl font-semibold tabular-nums text-paper">
            {format(value)}
          </span>
          {suffix ? <span className="ml-1 text-[10px] uppercase tracking-wider text-mist-dim">{suffix}</span> : null}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="grid size-10 place-items-center rounded-xl text-mist-dim transition-colors hover:bg-panel hover:text-paper disabled:opacity-30"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-paper">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-mist-dim">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent/60 bg-accent' : 'border-line-bright bg-panel-raised',
        )}
      >
        <span
          className={cn(
            'absolute top-1 size-[18px] rounded-full transition-transform duration-200',
            checked ? 'translate-x-[26px] bg-ink' : 'translate-x-1 bg-mist',
          )}
        />
      </button>
    </div>
  );
}

export function RangeInput({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  display: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-mist-dim">
          {label}
        </label>
        <span className="font-display text-lg font-semibold text-paper">{display}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="strikr-range w-full"
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line bg-coal shadow-2xl animate-fade-up sm:rounded-[28px]',
          size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-6">
          <div>
            <h2 id="modal-title" className="font-display text-2xl font-semibold uppercase tracking-[0.03em]">
              {title}
            </h2>
            {description ? <p className="mt-1 text-xs leading-relaxed text-mist-dim">{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-1 -mt-1 border-transparent bg-transparent">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="border-t border-line/70 bg-coal/95 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-mist">This action cannot be undone.</p>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-panel/30 px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel text-mist-dim">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold uppercase tracking-[0.03em] text-paper">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist-dim">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatTile({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel/50 px-4 py-3.5">
      <p className="font-display text-2xl font-semibold tabular-nums leading-none text-paper">
        {value}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
        {label}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-mist-dim/70">{hint}</p> : null}
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs leading-relaxed text-danger">
      {children}
    </div>
  );
}

export function InlineNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-xs leading-relaxed text-mist-dim">
      {children}
    </div>
  );
}
