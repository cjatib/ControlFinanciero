import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  tone?: 'danger' | 'neutral';
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} hideCloseButton centered>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 text-center">
          <div
            className={
              tone === 'danger'
                ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger/15 text-rose-200'
                : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent'
            }
          >
            {tone === 'danger' ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v5" strokeLinecap="round" />
                <path d="M12 16h.01" strokeLinecap="round" />
                <path
                  d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="ghost" fullWidth size="lg" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} fullWidth size="lg" onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
