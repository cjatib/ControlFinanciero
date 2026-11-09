import { useState } from 'react';
import { PWA_UPDATE_EVENT } from '@/registerServiceWorker';

export function PwaUpdateCheck() {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supported = import.meta.env.PROD
    && typeof window !== 'undefined'
    && window.isSecureContext
    && 'serviceWorker' in navigator;

  async function checkNow() {
    setChecking(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setMessage('El service worker todavía no está instalado. Cierra y vuelve a abrir la app HTTPS.');
        return;
      }
      await registration.update();
      if (registration.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new Event(PWA_UPDATE_EVENT));
        setMessage('Hay una actualización disponible. Usa el aviso superior para instalarla.');
      } else {
        setMessage('Comprobación iniciada. Si se detecta una versión nueva, aparecerá un aviso. No se recargará automáticamente.');
      }
    } catch {
      setMessage('No fue posible consultar actualizaciones. Comprueba la conexión a internet.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="space-y-3" aria-label="Actualizaciones de la aplicación">
      <h2 className="text-lg font-bold text-ink">Actualizaciones de la PWA</h2>
      <p className="text-sm leading-6 text-slate-400">
        Busca versiones nuevas sin cerrar la sesión. Solo se recargará cuando tú confirmes la actualización.
      </p>
      {supported ? (
        <button type="button" disabled={checking} onClick={() => void checkNow()}
          className="min-h-11 rounded-xl border border-accent/30 bg-accent/10 px-4 text-sm font-bold text-accent disabled:opacity-60">
          {checking ? 'Comprobando...' : 'Buscar actualizaciones'}
        </button>
      ) : (
        <p className="rounded-xl bg-white/5 px-3 py-3 text-xs leading-5 text-slate-400">
          Disponible en la app compilada y abierta por HTTPS, o desde localhost en un navegador compatible.
          No funciona en modo desarrollo ni por una IP local HTTP.
        </p>
      )}
      {message ? <p className="rounded-xl bg-accent/10 px-3 py-3 text-sm text-accent" role="status">{message}</p> : null}
    </section>
  );
}
