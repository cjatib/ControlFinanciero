export const PWA_UPDATE_EVENT = 'controlfinanciero:pwa-update';

function notifyUpdate(): void {
  window.dispatchEvent(new Event(PWA_UPDATE_EVENT));
}

export function registerServiceWorker(): void {
  // Service workers require HTTPS or localhost. Vite dev mode deliberately
  // does not register a worker or intercept the development server.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          import.meta.env.BASE_URL + 'sw.js',
          { updateViaCache: 'none' },
        );

        function checkWaiting(): void {
          if (registration.waiting && navigator.serviceWorker.controller) notifyUpdate();
        }

        checkWaiting();
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed') checkWaiting();
          });
        });

        // iOS can keep an installed PWA open for days; check when returning to
        // it rather than periodically forcing updates while forms are open.
        let lastChecked = 0;
        function checkForUpdates(): void {
          if (document.visibilityState !== 'visible' || !navigator.onLine) return;
          if (Date.now() - lastChecked < 30 * 60 * 1000) return;
          lastChecked = Date.now();
          void registration.update().catch((error: unknown) => {
            console.warn('No se pudo comprobar la actualización de la PWA.', error);
          });
        }

        document.addEventListener('visibilitychange', checkForUpdates);
        window.addEventListener('online', checkForUpdates);
        window.addEventListener('focus', checkForUpdates);
        checkForUpdates();
      } catch (error) {
        console.error('No se pudo registrar el service worker', error);
      }
    })();
  }, { once: true });
}
