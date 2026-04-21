import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Card } from './Card';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  hideCloseButton?: boolean;
  centered?: boolean;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  hideCloseButton = false,
  centered = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-slate-950/70 p-4 backdrop-blur-sm ${
        centered ? 'items-center' : 'items-end sm:items-center'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <Card className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
          </div>
          {hideCloseButton ? null : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
        {children}
      </Card>
    </div>,
    document.body,
  );
}
