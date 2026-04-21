import { Button, type ButtonProps } from './Button';

export function EditIcon({ className = 'h-5 w-5' }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path d="m4 20 4.5-1 9-9a2.12 2.12 0 1 0-3-3l-9 9L4 20Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 6.5 17.5 10.5" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ className = 'h-5 w-5' }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
      <path d="M7 7l.8 11.2A2 2 0 0 0 9.8 20h4.4a2 2 0 0 0 2-1.8L17 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" strokeLinecap="round" />
    </svg>
  );
}

type ActionIconButtonProps = Omit<ButtonProps, 'children' | 'variant' | 'size'> & {
  tone: 'edit' | 'delete';
};

export function ActionIconButton({ tone, className, ...props }: ActionIconButtonProps) {
  const isEdit = tone === 'edit';

  return (
    <Button
      variant={isEdit ? 'primary' : 'danger'}
      size="sm"
      className={isEdit ? `h-12 w-12 rounded-xl px-0 shadow-none ${className ?? ''}`.trim() : `h-12 w-12 rounded-xl px-0 ${className ?? ''}`.trim()}
      {...props}
    >
      {isEdit ? <EditIcon /> : <TrashIcon />}
    </Button>
  );
}

