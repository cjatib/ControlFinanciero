import { useEffect, useRef, useState } from 'react';
import { PWA_UPDATE_EVENT } from '@/registerServiceWorker';

export function PwaUpdateBanner() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedReload = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

    let alive = true;
    const onAvailable = () => {
      if (alive) {
        setAvailable(true);
        setDismissed(false);
      }
    };
    const onControllerChange = () => {
      if (requestedReload.current) window.location.reload();
    };

    window.addEventListener(PWA_UPDATE_EVENT, onAvailable);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (alive && registration?.waiting && navigator.serviceWorker.controller) onAvailable();
    }).catch(() => {
      // An unsupported or disabled registration should not block the app.
    });

    return () => {
      alive = false;
      window.removeEventListener(PWA_UPDATE_EVENT, onAvailable);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!available || dismissed) return null;

  async function activateUpdate() {
    setError(null);
    setApplying(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.waiting) {
        // The waiting worker may have been activated by another app tab.
        window.location.reload();
        return;
      }
      requestedReload.current = true;
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      requestedReload.current = false;
      setApplying(false);
      setError('No se pudo aplicar la actualización. Puedes cerrar y abrir la aplicación nuevamente.');
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-accent/30 bg-[#292f42] p-4 shadow-lg"
      aria-label="Actualización de la aplicación" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-xl" aria-hidden="true">↻</span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-bold text-ink">Hay una nueva versión disponible</p>
          <p className="text-sm leading-5 text-slate-300">
            Guarda cualquier movimiento que estés editando antes de actualizar. La aplicación se recargará cuando lo confirmes.
          </p>
          {error ? <p role="alert" className="text-sm text-rose-200">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void activateUpdate()} disabled={applying}
              className="min-h-11 rounded-xl bg-accent px-4 text-sm font-extrabold text-slate-950 disabled:opacity-60">
              {applying ? 'Actualizando...' : 'Actualizar ahora'}
            </button>
            <button type="button" onClick={() => setDismissed(true)} disabled={applying}
              className="min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-slate-200 disabled:opacity-60">
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
