import { Link, Outlet } from 'react-router-dom';
import { InstallPromptBanner } from '@/components/InstallPromptBanner';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-90" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="hidden flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 shadow-glow backdrop-blur lg:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent/80">
                ControlFinanciero
              </p>
              <h1 className="mt-4 max-w-xl text-5xl font-extrabold leading-tight tracking-tight text-ink">
                Un control claro para tus ingresos, gastos y saldo diario.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-400">
                PWA minimalista con Firebase, pensada para registrar movimientos, revisar historico y cuidar tu flujo de caja desde el movil.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Sesiones</p>
                <p className="mt-2 text-2xl font-bold text-ink">Seguras</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Diseño</p>
                <p className="mt-2 text-2xl font-bold text-ink">Dark</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Acceso</p>
                <p className="mt-2 text-2xl font-bold text-ink">PWA</p>
              </div>
            </div>
          </section>

          <section className="glass-card mx-auto w-full max-w-xl p-6 sm:p-8">
            <div className="mb-8 lg:hidden">
              <Link to="/login" className="text-xs font-semibold uppercase tracking-[0.28em] text-accent/80">
                ControlFinanciero
              </Link>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
                Tu resumen financiero, simple y en un solo lugar.
              </h1>
            </div>
            <InstallPromptBanner />
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
