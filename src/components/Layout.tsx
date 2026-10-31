import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  History,
  Home,
  Layers3,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/cn';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true, index: '01' },
  { to: '/combos', label: 'Combos', icon: Layers3, index: '02' },
  { to: '/ai', label: 'AI Lab', icon: Sparkles, index: '03' },
  { to: '/history', label: 'History', icon: History, index: '04' },
  { to: '/settings', label: 'Settings', icon: Settings, index: '05' },
];

export function AppLayout() {
  const { pathname } = useLocation();
  const online = useOnlineStatus();
  const current = navItems.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  );
  const currentLabel = pathname === '/setup' ? 'session' : (current?.label.toLowerCase() ?? 'workspace');
  const date = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-coal lg:flex">
        <div className="window-bar min-h-8 border-line bg-ink-soft px-2.5">
          <span className="window-controls" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="window-title">strikr :: workspace</span>
          <span className="window-code">v1.0</span>
        </div>

        <div className="border-b border-line px-4 py-4">
          <Logo />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="meta-label text-accent">Navigation</p>
            <span className="font-mono text-[9px] text-mist-dim">05</span>
          </div>
          <nav className="space-y-px">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 border px-2.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-100',
                    isActive
                      ? 'border-line border-l-accent border-l-2 bg-panel text-paper'
                      : 'border-transparent text-mist-dim hover:border-line hover:bg-panel hover:text-paper',
                  )
                }
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-[8px] font-normal text-mist-dim">{item.index}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6">
            <p className="meta-label mb-2 px-1">Quick action</p>
            <Link
              to="/setup"
              className="group flex items-center justify-between border border-accent bg-accent px-3 py-3 text-ink transition-colors hover:bg-accent-bright"
            >
              <div>
                <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] opacity-70">
                  New session
                </p>
                <p className="mt-1 font-display text-xl font-semibold uppercase leading-none">
                  Build a round
                </p>
              </div>
              <Plus className="size-4" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="mt-6 border border-line bg-ink-soft">
            <div className="window-bar min-h-7 border-line px-2">
              <span className="window-title text-[9px]">System</span>
              <span className="window-code">SYS</span>
            </div>
            <div className="space-y-2 p-2.5">
              <StatusRow label="Engine" value="Local" />
              <StatusRow label="Storage" value="Device" />
              <StatusRow label="Network" value={online ? 'Online' : 'Offline'} tone={online ? 'ok' : 'warn'} />
              <StatusRow label="AI proxy" value="Server-side" />
            </div>
          </div>
        </div>

        <div className="border-t border-line bg-ink-soft px-3 py-2.5">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-mist-dim">
            <span className="inline-flex items-center gap-1.5">
              <span className="status-dot" /> Local-first
            </span>
            <span className={online ? 'text-success' : 'text-accent'}>
              {online ? 'Synced' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-coal px-3 lg:hidden">
        <Logo />
        <Link
          to="/setup"
          className="flex h-9 items-center gap-1.5 border border-accent bg-accent px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink"
        >
          <Plus className="size-3.5" strokeWidth={2.4} />
          Session
        </Link>
      </header>

      <main className="lg:pl-[248px]">
        <div className="sticky top-0 z-20 hidden h-8 items-center justify-between border-b border-line bg-ink-soft px-4 lg:flex lg:px-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-dim">
            <span className="text-accent">/</span> workspace / {currentLabel}
          </p>
          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.1em] text-mist-dim">
            <span className="hidden xl:inline">
              {online ? 'NET / CONNECTED' : 'NET / OFFLINE CACHE'}
            </span>
            <span className="hidden sm:inline">{date}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={online ? 'status-dot' : 'size-1.5 bg-accent'} />
              {online ? 'Ready' : 'Local'}
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[92rem] px-3 pb-28 pt-3 sm:px-5 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-5">
          <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.06em]">
      <span className="text-mist-dim">{label}</span>
      <span className={cn('text-mist', tone === 'ok' && 'text-success', tone === 'warn' && 'text-accent')}>
        {value}
      </span>
    </div>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-coal pb-safe lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[58px] flex-col items-center justify-center gap-1 border-r border-line/60 font-mono text-[8px] font-semibold uppercase tracking-[0.08em] transition-colors last:border-r-0',
                isActive ? 'bg-panel text-paper' : 'text-mist-dim',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute inset-x-0 top-0 h-0.5',
                    isActive ? 'bg-accent' : 'bg-transparent',
                  )}
                />
                <item.icon
                  className={cn('size-[18px]', isActive ? 'text-accent' : 'text-current')}
                  strokeWidth={isActive ? 2.1 : 1.7}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
