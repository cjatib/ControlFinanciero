import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  hideCloseButton?: boolean;
  centered?: boolean;
}

export function Modal({
  open, title, description, onClose, children, footer,
  hideCloseButton = false, centered = false,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    // Do not focus a text field automatically: that would open the iPhone keyboard.
    const frame = window.requestAnimationFrame(
      () => (closeRef.current ?? dialogRef.current)?.focus({ preventScroll: true }),
    );

    function onKeyDown(event: KeyboardEvent) {
      // Only the uppermost dialog responds when a detail dialog contains another modal.
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab') {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
        );
        if (!elements?.length) return;
        const first = elements[0]!;
        const last = elements[elements.length - 1]!;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={'fixed inset-0 z-50 flex justify-center bg-slate-950/75 px-2 pt-3 backdrop-blur-sm sm:px-4 sm:py-6 ' +
        (centered ? 'items-center pb-3' : 'items-end pb-0 sm:items-center')}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar ventana"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={'glass-card relative z-10 flex min-w-0 w-full max-w-lg flex-col overflow-hidden bg-[#191c29] outline-none ' +
          (centered ? 'rounded-[1.6rem]' : 'rounded-t-[1.6rem] rounded-b-none sm:rounded-[1.6rem]')}
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 0.5rem)' }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">{title}</h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">{description}</p>
            ) : null}
          </div>
          {hideCloseButton ? null : (
            <button
              ref={closeRef}
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              aria-label="Cerrar sin guardar"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
          style={!footer ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' } : undefined}
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-white/10 bg-[#191c29] px-4 pt-2.5 sm:px-5"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
