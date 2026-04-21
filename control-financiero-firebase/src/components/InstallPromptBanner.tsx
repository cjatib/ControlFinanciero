import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

type MobilePlatform = 'ios' | 'android' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const INSTALL_BANNER_DISMISSED_KEY = 'controlfinanciero-install-banner-dismissed';

function getMobilePlatform(): MobilePlatform {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isAndroid = userAgent.includes('android');
  const isIPhone = /iphone|ipod/.test(userAgent);
  const isIPad =
    /ipad/.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

  if (isAndroid) {
    return 'android';
  }

  if (isIPhone || isIPad) {
    return 'ios';
  }

  return 'other';
}

function isStandaloneMode(): boolean {
  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || standaloneNavigator.standalone === true;
}

function readDismissedState(): boolean {
  try {
    return window.sessionStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissedState() {
  try {
    window.sessionStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1');
  } catch {
    // ignore storage failures
  }
}

export function InstallPromptBanner() {
  const [platform, setPlatform] = useState<MobilePlatform>('other');
  const [hidden, setHidden] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function updateEnvironment() {
      setPlatform(getMobilePlatform());
      setIsInstalled(isStandaloneMode());
      setHidden(readDismissedState());
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      persistDismissedState();
      setHidden(true);
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    updateEnvironment();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const iconSrc = useMemo(() => `${import.meta.env.BASE_URL}icon.svg`, []);

  if (hidden || isInstalled || platform === 'other') {
    return null;
  }

  async function handleInstall() {
    if (!deferredPrompt) {
      setShowGuide(true);
      return;
    }

    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === 'accepted') {
        persistDismissedState();
        setHidden(true);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    persistDismissedState();
    setHidden(true);
  }

  const title = platform === 'ios' ? 'Instala la app en tu iPhone' : 'Instala la app en tu Android';
  const buttonLabel =
    platform === 'ios'
      ? 'Ver como instalar'
      : deferredPrompt
        ? installing
          ? 'Preparando instalacion...'
          : 'Instalar app'
        : 'Ver como instalar';

  const guideSteps =
    platform === 'ios'
      ? [
          'Abre el menu Compartir de Safari.',
          'Busca la opcion "Agregar a pantalla de inicio".',
          'Confirma para dejar el icono de ControlFinanciero en tu inicio.',
        ]
      : [
          'Abre el menu principal del navegador.',
          'Selecciona "Instalar app" o "Agregar a pantalla principal".',
          'Confirma la instalacion para dejar el icono en tu inicio.',
        ];

  return (
    <>
      <Card className="mb-5 overflow-hidden border-accent/15 bg-gradient-to-r from-accent/10 via-white/[0.05] to-white/[0.03] p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <img
            src={iconSrc}
            alt="Icono ControlFinanciero"
            className="h-14 w-14 rounded-2xl border border-white/10 bg-slate-950/70 p-2 shadow-[0_12px_24px_rgba(53,217,165,0.18)]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">PWA instalable</p>
                <h2 className="mt-2 text-lg font-bold text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Deja ControlFinanciero en tu pantalla de inicio para abrirla como una app.
                </p>
              </div>

              <button
                type="button"
                aria-label="Ocultar aviso de instalacion"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/8 hover:text-ink"
                onClick={handleDismiss}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="md" onClick={() => void handleInstall()} disabled={installing}>
                {buttonLabel}
              </Button>
              <Button variant="ghost" size="md" onClick={handleDismiss}>
                Ahora no
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        open={showGuide}
        title={platform === 'ios' ? 'Como instalar en iPhone' : 'Como instalar en Android'}
        description="Tu navegador no permite lanzar la instalacion directamente desde este sitio, pero estos pasos lo dejan listo en segundos."
        onClose={() => setShowGuide(false)}
        centered
      >
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
            <img
              src={iconSrc}
              alt="Icono ControlFinanciero"
              className="h-14 w-14 rounded-2xl border border-white/10 bg-slate-950/70 p-2"
            />
            <div>
              <p className="text-sm font-semibold text-ink">ControlFinanciero</p>
              <p className="mt-1 text-sm text-slate-400">Instalable como acceso directo en tu pantalla de inicio.</p>
            </div>
          </div>

          <ol className="space-y-3">
            {guideSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm leading-6 text-slate-300">{step}</span>
              </li>
            ))}
          </ol>

          <Button fullWidth size="lg" onClick={() => setShowGuide(false)}>
            Entendido
          </Button>
        </div>
      </Modal>
    </>
  );
}
