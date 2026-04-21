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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M11.25 3h1.5l.84 2.34a7.5 7.5 0 0 1 1.96.81l2.3-.94 1.06 1.06-.94 2.3c.34.61.61 1.27.8 1.96L21 11.25v1.5l-2.34.84a7.51 7.51 0 0 1-.81 1.96l.94 2.3-1.06 1.06-2.3-.94c-.61.34-1.27.61-1.96.8L12.75 21h-1.5l-.84-2.34a7.5 7.5 0 0 1-1.96-.81l-2.3.94-1.06-1.06.94-2.3a7.51 7.51 0 0 1-.8-1.96L3 12.75v-1.5l2.34-.84c.19-.69.46-1.35.81-1.96l-.94-2.3 1.06-1.06 2.3.94c.61-.34 1.27-.61 1.96-.8L11.25 3Zm.75 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Inicio',
    icon: DashboardIcon,
  },
  {
    to: '/categories',
    label: 'Categorias',
    icon: CategoryIcon,
  },
  {
    to: '/history',
    label: 'Historico',
    icon: HistoryIcon,
  },
  {
    to: '/settings',
    label: 'Ajustes',
    icon: SettingsIcon,
  },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-90" />
      <div className="pointer-events-none absolute left-1/2 top-[-8rem] h-80 w-80 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-4 sm:max-w-6xl sm:px-6 lg:px-8">
        <main className="flex-1 space-y-6 pt-2">
          <InstallPromptBanner />
          <Outlet />
        </main>
      </div>

      <Link
        to="/transactions?create=1"
        className={cn(
          'fixed bottom-[5.7rem] left-1/2 z-30 inline-flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-slate-950 shadow-[0_16px_34px_rgba(53,217,165,0.38)] transition hover:scale-[1.03] hover:bg-[#69e8be]',
          location.pathname === '/transactions' && 'ring-4 ring-accent/20',
        )}
        aria-label="Agregar transaccion"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </Link>

      <nav className="fixed inset-x-0 bottom-4 z-20 px-4 sm:px-6">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center rounded-[2rem] border border-white/10 bg-slate-950/80 px-3 py-3 shadow-glow backdrop-blur-xl sm:max-w-6xl">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.to} className={cn(index === 2 && 'col-start-4')}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 text-[10px] font-semibold tracking-[0.08em] text-slate-500 transition',
                      isActive && 'bg-white/6 text-ink',
                    )
                  }
                >
                  <Icon />
                  <span className="text-center leading-tight">{item.label}</span>
                </NavLink>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
