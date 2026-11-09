import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { InstallPromptBanner } from '@/components/InstallPromptBanner';
import { cn } from '@/lib/cn';

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13h6V5H4v8Zm10 6h6V5h-6v14ZM4 19h6v-4H4v4Z" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7h12M6 12h7M6 17h12" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 8v5l3 2m6-3a9 9 0 1 1-2.64-6.36M21 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-7Z"
        strokeLinejoin="round"
      />
      <path d="M4 10.5h16M8 15h3" strokeLinecap="round" />
    </svg>
  );
}

function SavingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 5c4.42 0 8 2.91 8 6.5 0 5.14-4.48 7.8-8 7.8S4 16.64 4 11.5C4 7.91 7.58 5 12 5Z"
        strokeLinejoin="round"
      />
      <path d="M12 9.25v4.5M9.75 11.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M11.25 3h1.5l.84 2.34a7.5 7.5 0 0 1 1.96.81l2.3-.94 1.06 1.06-.94 2.3c.34.61.61 1.27.8 1.96L21 11.25v1.5l-2.34.84a7.51 7.51 0 0 1-.81 1.96l.94 2.3-1.06 1.06-2.3-.94c-.61.34-1.27.61-1.96.8L12.75 21h-1.5l-.84-2.34a7.5 7.5 0 0 1-1.96-.81l-2.3.94-1.06-1.06.94-2.3a7.51 7.51 0 0 1-.8-1.96L3 12.75v-1.5l2.34-.84c.19-.69.46-1.35.81-1.96l-.94-2.3 1.06-1.06 2.3.94c.61-.34 1.27-.61 1.96-.8L11.25 3Zm.75 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" strokeLinejoin="round" />
    </svg>
  );
}


function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 16v-5M13 16V7M18 16v-8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h11M7 4v6M17 9v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 15v-5M13 15V7M18 15v-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

const MAIN_NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: DashboardIcon },
  { to: '/transactions', label: 'Movimientos', icon: TransactionsIcon },
  { to: '/plan', label: 'Plan', icon: PlanIcon },
  { to: '/savings', label: 'Ahorro', icon: SavingsIcon },
];

const SECONDARY_NAV_ITEMS = [
  { to: '/history', label: 'Historial', icon: HistoryIcon },
  { to: '/reports', label: 'Reportes', icon: ReportsIcon },
  { to: '/categories', label: 'Categorías', icon: CategoryIcon },
  { to: '/credits', label: 'Créditos', icon: CreditIcon },
  { to: '/settings', label: 'Ajustes', icon: SettingsIcon },
];

export function AppLayout() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isSecondary = SECONDARY_NAV_ITEMS.some((item) => location.pathname.startsWith(item.to));

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-90" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pt-5 sm:max-w-6xl sm:px-6 lg:px-8"
        style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        <main className="flex-1 space-y-6 pt-2">
          <InstallPromptBanner />
          <Outlet />
        </main>
      </div>

      <Link
        to="/transactions?create=1"
        className="fixed right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-slate-950 shadow-[0_12px_30px_rgba(183,198,250,0.28)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50 sm:right-8"
        style={{ bottom: 'calc(6.2rem + env(safe-area-inset-bottom))' }}
        aria-label="Registrar nuevo movimiento"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </Link>

      {moreOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-30 bg-slate-950/50" aria-label="Cerrar menú Más"
            onClick={() => setMoreOpen(false)} />
          <div className="fixed inset-x-4 z-40 mx-auto max-w-md rounded-3xl border border-white/10 bg-[#232630] p-3 shadow-2xl sm:max-w-lg"
            style={{ bottom: 'calc(6.8rem + env(safe-area-inset-bottom))' }} role="menu" aria-label="Más secciones">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Más secciones</p>
            <div className="grid grid-cols-1 gap-1">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.to);
                return (
                  <Link key={item.to} to={item.to} role="menuitem" onClick={() => setMoreOpen(false)}
                    className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      active ? 'bg-accent/15 text-accent' : 'text-slate-200 hover:bg-white/10')}>
                    <Icon />
                    <span>{item.label}</span>
                    {active ? <span className="ml-auto text-xs">Actual</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <nav className="fixed inset-x-0 z-40 px-3 sm:px-6" style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        aria-label="Navegación principal">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1 rounded-[1.6rem] border border-white/10 bg-[#242630]/95 p-2 shadow-glow backdrop-blur-xl sm:max-w-3xl">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-white/10',
                )}>
                <Icon />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
          <button type="button" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}
            aria-haspopup="menu" aria-label="Más secciones"
            className={cn('flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-semibold transition',
              moreOpen || isSecondary ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-white/10')}>
            <MoreIcon />
            <span>Más</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
