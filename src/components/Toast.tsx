import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '../lib/cn';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = (nextId.current += 1);
    setItems((current) => [...current.slice(-2), { id, message, tone }]);
    const timer = window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
    timers.current.push(timer);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto w-full max-w-sm border bg-coal animate-fade-up',
              item.tone === 'success' && 'border-success/45',
              item.tone === 'error' && 'border-danger/50',
              item.tone === 'info' && 'border-line-bright',
            )}
          >
            <div className="window-bar min-h-6 border-line bg-ink-soft px-2">
              <span className="window-controls" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span className="window-title text-[9px]">
                {item.tone === 'success' ? 'success' : item.tone === 'error' ? 'error' : 'notice'}
              </span>
              <span className="window-code">SYS</span>
            </div>
            <div
              className={cn(
                'flex items-start gap-2 border-l-2 px-3 py-2.5 text-[11px] leading-relaxed',
                item.tone === 'success' && 'border-l-success text-success',
                item.tone === 'error' && 'border-l-danger text-danger',
                item.tone === 'info' && 'border-l-accent text-paper',
              )}
            >
              {item.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              ) : item.tone === 'error' ? (
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0 text-accent" />
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.03em]">{item.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
