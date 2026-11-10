import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Card } from './Card';

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
  open,
  title,
  description,
  onClose,
  children,
  footer,
  hideCloseButton = false,
  centered = false,
}: ModalProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-slate-950/70 px-3 pb-2 pt-3 backdrop-blur-sm ${
        centered ? 'items-center' : 'items-end sm:items-center'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <Card role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-[2rem] bg-[#191c29]" style={{ maxHeight: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem)" }}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-ink">{title}</h2>
            {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
          </div>
          {hideCloseButton ? null : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer ? <div className="shrink-0 border-t border-white/10 bg-[#191c29] px-5 pt-3" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>{footer}</div> : null}
      </Card>
    </div>,
    document.body,
  );
}
