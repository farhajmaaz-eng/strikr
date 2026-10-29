import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ChevronRight,
  History,
  Home,
  Layers3,
  Plus,
  Settings,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/cn';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/combos', label: 'Combos', icon: Layers3 },
  { to: '/ai', label: 'AI Lab', icon: Sparkles },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line/70 bg-coal/70 px-5 py-6 backdrop-blur-xl lg:flex">
        <Logo />
        <div className="mt-10">
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-mist-dim">
            Training
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-panel text-paper shadow-[inset_2px_0_0_var(--color-accent)]'
                      : 'text-mist-dim hover:bg-panel/60 hover:text-paper',
                  )
                }
              >
                <item.icon className="size-[18px]" strokeWidth={1.8} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-3">
          <Link
            to="/setup"
            className="flex items-center justify-between rounded-2xl border border-line bg-panel/60 p-4 transition-colors hover:border-line-bright hover:bg-panel"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                New session
              </p>
              <p className="mt-1 font-display text-xl font-semibold uppercase leading-none">
                Build a round
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-accent text-ink">
              <Plus className="size-4" />
            </span>
          </Link>
          <div className="flex items-center gap-2 px-2 text-[10px] font-medium text-mist-dim">
            <WifiOff className="size-3.5" />
            Offline-ready · local-first
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/60 bg-ink/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <Link
          to="/setup"
          className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-paper"
        >
          <Plus className="size-3.5 text-accent" />
          Session
        </Link>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-7 sm:px-6 sm:pt-9 lg:px-10 lg:pb-14 lg:pt-10">
          <Outlet />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-coal/88 pb-safe backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 px-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[62px] flex-col items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] transition-colors',
                isActive ? 'text-paper' : 'text-mist-dim',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute top-0 h-0.5 w-7 rounded-full bg-accent" />
                ) : null}
                <item.icon
                  className={cn('size-[19px]', isActive ? 'text-accent' : 'text-current')}
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

export function QuickStartLink() {
  return (
    <Link
      to="/setup"
      className="inline-flex items-center gap-1 text-xs font-semibold text-accent-bright"
    >
      Build session <ChevronRight className="size-3.5" />
    </Link>
  );
}
