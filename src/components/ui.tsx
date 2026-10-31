import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
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
  primary: 'bg-accent text-ink hover:bg-accent-bright active:bg-accent-deep',
  secondary:
    'bg-panel text-paper border border-line hover:border-line-bright hover:bg-panel-raised',
  ghost: 'bg-transparent text-mist border border-transparent hover:bg-panel hover:text-paper',
  danger: 'bg-danger/10 text-danger border border-danger/35 hover:bg-danger/20',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[10px] gap-1.5',
  md: 'h-10 px-4 text-[11px] gap-2',
  lg: 'h-12 px-5 text-xs gap-2',
  icon: 'size-10',
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
        'inline-flex select-none items-center justify-center border font-mono font-semibold uppercase tracking-[0.08em] transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        'disabled:pointer-events-none disabled:opacity-35',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : icon}
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
        'grid size-9 shrink-0 place-items-center border border-line bg-panel text-mist transition-colors hover:border-line-bright hover:bg-panel-raised hover:text-paper',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-35',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function WindowBar({
  title,
  code,
  actions,
  active = false,
  className,
}: {
  title: ReactNode;
  code?: ReactNode;
  actions?: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'window-bar',
        active && 'border-line-bright bg-panel-raised',
        className,
      )}
    >
      <span className="window-controls" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="window-title">{title}</span>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      {code ? <span className="window-code">{code}</span> : null}
    </div>
  );
}

export function WindowFrame({
  title,
  code,
  actions,
  active = false,
  children,
  className,
  bodyClassName,
  footer,
}: {
  title: ReactNode;
  code?: ReactNode;
  actions?: ReactNode;
  active?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'window-panel flex min-w-0 flex-col',
        active && 'border-line-bright',
        className,
      )}
    >
      <WindowBar title={title} code={code} actions={actions} active={active} />
      <div className={cn('min-w-0 flex-1', bodyClassName)}>{children}</div>
      {footer ? <div className="border-t border-line bg-ink-soft">{footer}</div> : null}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  code,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  code?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="window-panel mb-4 animate-fade-up">
      <WindowBar
        title={eyebrow ?? 'strikr :: workspace'}
        code={code ?? 'STRIKR'}
        actions={actions}
      />
      <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
        <div className="min-w-0">
          <h1 className="font-display text-[40px] font-semibold uppercase leading-[0.84] tracking-[0.01em] text-paper sm:text-[56px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-mist sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
      </div>
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
    <div className="mb-3 flex items-end justify-between gap-4 border-b border-line pb-2">
      <div>
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-paper">
          {title}
        </h2>
        {detail ? <p className="mt-1 text-[11px] text-mist-dim">{detail}</p> : null}
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
        'grid divide-x divide-line border border-line bg-ink-soft',
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
              'flex items-center justify-center gap-1.5 px-2 font-mono font-semibold uppercase tracking-[0.08em] transition-colors duration-100',
              compact ? 'min-h-8 text-[9px]' : 'min-h-10 text-[10px]',
              active
                ? 'bg-accent text-ink'
                : 'text-mist-dim hover:bg-panel hover:text-paper',
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
    accent: 'border-accent/45 bg-accent/10 text-accent-bright',
    success: 'border-success/35 bg-success/10 text-success',
    danger: 'border-danger/35 bg-danger/10 text-danger',
    muted: 'border-line bg-transparent text-mist-dim',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-1.5 py-1 font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.1em]',
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
    <div className="min-w-0">
      <label id={id} className="meta-label mb-1.5 block">
        {label}
      </label>
      <div className="flex h-12 min-w-0 items-stretch border border-line bg-ink-soft">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="grid w-9 shrink-0 place-items-center border-r border-line text-mist-dim transition-colors hover:bg-panel hover:text-paper disabled:opacity-25"
        >
          <Minus className="size-3.5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1" aria-labelledby={id}>
          <span className="truncate font-display text-xl font-semibold tabular-nums text-paper">
            {format(value)}
          </span>
          {suffix ? <span className="text-[8px] uppercase tracking-wider text-mist-dim">{suffix}</span> : null}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="grid w-9 shrink-0 place-items-center border-l border-line text-mist-dim transition-colors hover:bg-panel hover:text-paper disabled:opacity-25"
        >
          <Plus className="size-3.5" />
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
        <p className="text-[13px] font-medium text-paper">{label}</p>
        {description ? <p className="mt-0.5 text-[11px] leading-relaxed text-mist-dim">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 border transition-colors duration-100',
          checked ? 'border-accent bg-accent' : 'border-line-bright bg-ink-soft',
        )}
      >
        <span
          className={cn(
            'absolute left-[3px] top-[3px] size-4 transition-transform duration-100',
            checked ? 'translate-x-[22px] bg-ink' : 'translate-x-0 bg-mist-dim',
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
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between border-b border-line pb-1.5">
        <label className="meta-label">{label}</label>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-paper">{display}</span>
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
        style={{ '--range-progress': `${progress}%` } as CSSProperties}
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
        className="absolute inset-0 cursor-default bg-black/80"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line-bright bg-coal animate-fade-up sm:max-h-[86dvh]',
          size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-4xl' : 'sm:max-w-xl',
        )}
      >
        <div className="window-bar min-h-9 border-line-bright bg-panel-raised px-3">
          <span className="window-controls" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <h2 id="modal-title" className="window-title text-paper">
            {title}
          </h2>
          <span className="window-code">DIALOG</span>
          <IconButton
            label="Close"
            onClick={onClose}
            className="size-7 border-transparent bg-transparent"
          >
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {description ? (
            <p className="mb-4 border-l-2 border-accent bg-ink-soft px-3 py-2 font-mono text-[10px] leading-relaxed tracking-[0.02em] text-mist-dim">
              {description}
            </p>
          ) : null}
          {children}
        </div>
        {footer ? (
          <div className="border-t border-line bg-ink-soft px-4 py-3 sm:px-5">{footer}</div>
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
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mist-dim">
        This action cannot be undone.
      </p>
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
    <div className="flex flex-col items-center border border-dashed border-line bg-panel/60 px-6 py-12 text-center">
      <div className="mb-4 grid size-10 place-items-center border border-line bg-ink-soft text-mist-dim">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-semibold uppercase tracking-[0.03em] text-paper">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-mist-dim">{description}</p>
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
    <div className="min-w-0 border border-line bg-panel px-3 py-3">
      <p className="font-display text-[26px] font-semibold tabular-nums leading-none text-paper">
        {value}
      </p>
      <p className="meta-label mt-2">{label}</p>
      {hint ? <p className="mt-1 font-mono text-[9px] text-mist-dim">{hint}</p> : null}
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div className="border border-danger/35 bg-danger/10 px-3 py-2 font-mono text-[10px] leading-relaxed text-danger">
      {children}
    </div>
  );
}

export function InlineNote({ children }: { children: ReactNode }) {
  return (
    <div className="border border-line bg-ink-soft px-3 py-2 font-mono text-[10px] leading-relaxed text-mist-dim">
      {children}
    </div>
  );
}
