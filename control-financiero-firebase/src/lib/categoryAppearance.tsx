import type { SVGProps } from 'react';

export const DEFAULT_CATEGORY_COLOR_BY_TYPE = {
  income: '#35d9a5',
  expense: '#fb7185',
} as const;

export const DEFAULT_CATEGORY_ICON_BY_TYPE = {
  income: 'chart',
  expense: 'wallet',
} as const;

export const CATEGORY_COLOR_OPTIONS = [
  { value: '#35d9a5', label: 'Menta' },
  { value: '#fb7185', label: 'Coral' },
  { value: '#60a5fa', label: 'Cielo' },
  { value: '#f59e0b', label: 'Ambar' },
  { value: '#a78bfa', label: 'Lavanda' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#e879f9', label: 'Orquidea' },
  { value: '#06b6d4', label: 'Aqua' },
  { value: '#84cc16', label: 'Lima' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#eab308', label: 'Dorado' },
  { value: '#14b8a6', label: 'Turquesa' },
  { value: '#78716c', label: 'Piedra' },
] as const;

export const CATEGORY_ICON_OPTIONS = [
  { value: 'wallet', label: 'Billetera' },
  { value: 'chart', label: 'Resumen' },
  { value: 'cart', label: 'Compras' },
  { value: 'supermarket', label: 'Supermercado' },
  { value: 'home', label: 'Hogar' },
  { value: 'car', label: 'Transporte' },
  { value: 'fuel', label: 'Bencina' },
  { value: 'fire', label: 'Gas' },
  { value: 'water', label: 'Agua' },
  { value: 'wifi', label: 'Internet' },
  { value: 'food', label: 'Comida' },
  { value: 'heart', label: 'Salud' },
  { value: 'briefcase', label: 'Trabajo' },
  { value: 'bank', label: 'Banco' },
  { value: 'gift', label: 'Regalos' },
  { value: 'receipt', label: 'Cuentas' },
  { value: 'book', label: 'Educacion' },
  { value: 'phone', label: 'Telefono' },
  { value: 'plane', label: 'Viajes' },
  { value: 'bolt', label: 'Luz' },
  { value: 'camera', label: 'Foto' },
  { value: 'ticket', label: 'Entradas' },
  { value: 'music', label: 'Musica' },
  { value: 'star', label: 'Favorito' },
  { value: 'grid', label: 'General' },
] as const;

type CategoryIconId = (typeof CATEGORY_ICON_OPTIONS)[number]['value'];

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function CategoryGlyph({
  icon,
  className,
}: {
  icon?: string | undefined;
  className?: string | undefined;
}) {
  const iconId = (icon || 'grid') as CategoryIconId;

  switch (iconId) {
    case 'wallet':
      return (
        <IconBase className={className}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v1H6.5A2.5 2.5 0 0 0 4 11.5v4A2.5 2.5 0 0 0 6.5 18H20v-6h-3.5a1.5 1.5 0 0 1 0-3H20" />
          <circle cx="16.5" cy="15" r="0.7" fill="currentColor" />
        </IconBase>
      );
    case 'chart':
      return (
        <IconBase className={className}>
          <path d="M4 19h16" />
          <path d="m6 14 3-3 3 2 5-6 1 1" />
          <path d="M17 7h2v2" />
        </IconBase>
      );
    case 'cart':
    case 'supermarket':
      return (
        <IconBase className={className}>
          <circle cx="9" cy="19" r="1" />
          <circle cx="17" cy="19" r="1" />
          <path d="M3 5h2l2.2 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.76L21 8H7" />
        </IconBase>
      );
    case 'home':
      return (
        <IconBase className={className}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </IconBase>
      );
    case 'car':
      return (
        <IconBase className={className}>
          <path d="M5 16v-3l2-5h10l2 5v3" />
          <path d="M4 16h16" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </IconBase>
      );
    case 'fuel':
      return (
        <IconBase className={className}>
          <path d="M7 6.5A2.5 2.5 0 0 1 9.5 4H14v16H9.5A2.5 2.5 0 0 1 7 17.5Z" />
          <path d="M14 8h2.2l2.3 2.4V18a2 2 0 1 0 4 0v-5.5l-1.6-1.6" />
          <path d="M10 8h1.8" />
        </IconBase>
      );
    case 'fire':
      return (
        <IconBase className={className}>
          <path d="M12 3c1.7 2.2 2.6 3.7 2.6 5.2A3.6 3.6 0 0 1 11 11.8c0-1.4.5-2.4 1.7-3.8-3.5 1.8-6.2 5-6.2 8.3A5.5 5.5 0 0 0 12 22a5.5 5.5 0 0 0 5.5-5.7c0-3.1-1.7-5.5-5.5-13.3Z" />
        </IconBase>
      );
    case 'water':
      return (
        <IconBase className={className}>
          <path d="M12 3c3 4 5.5 7 5.5 10.2A5.5 5.5 0 1 1 6.5 13.2C6.5 10 9 7 12 3Z" />
        </IconBase>
      );
    case 'wifi':
      return (
        <IconBase className={className}>
          <path d="M4.5 9.5a12 12 0 0 1 15 0" />
          <path d="M7.5 12.5a7.5 7.5 0 0 1 9 0" />
          <path d="M10.5 15.5a3 3 0 0 1 3 0" />
          <circle cx="12" cy="19" r="0.8" fill="currentColor" stroke="none" />
        </IconBase>
      );
    case 'food':
      return (
        <IconBase className={className}>
          <path d="M8 4v8" />
          <path d="M6 4v4" />
          <path d="M10 4v4" />
          <path d="M8 12v8" />
          <path d="M15 4c1.8 1.7 1.8 5.3 0 7v9" />
        </IconBase>
      );
    case 'heart':
      return (
        <IconBase className={className}>
          <path d="m12 20-6.2-6.1a4.3 4.3 0 1 1 6.1-6.1L12 8.9l.1-.1a4.3 4.3 0 1 1 6.1 6.1Z" />
        </IconBase>
      );
    case 'briefcase':
      return (
        <IconBase className={className}>
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
          <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z" />
          <path d="M4 12h16" />
        </IconBase>
      );
    case 'bank':
      return (
        <IconBase className={className}>
          <path d="M3 9 12 4l9 5" />
          <path d="M5 10v8" />
          <path d="M9.5 10v8" />
          <path d="M14.5 10v8" />
          <path d="M19 10v8" />
          <path d="M3 20h18" />
        </IconBase>
      );
    case 'gift':
      return (
        <IconBase className={className}>
          <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
          <path d="M21 8v4H3V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1Z" />
          <path d="M12 7v13" />
          <path d="M12 7H8.5a2.5 2.5 0 1 1 0-5c2 0 3.5 2.2 3.5 5Z" />
          <path d="M12 7h3.5a2.5 2.5 0 1 0 0-5c-2 0-3.5 2.2-3.5 5Z" />
        </IconBase>
      );
    case 'receipt':
      return (
        <IconBase className={className}>
          <path d="M7 4h10v16l-2-1.5L13 20l-2-1.5L9 20l-2-1.5L5 20V4Z" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
        </IconBase>
      );
    case 'book':
      return (
        <IconBase className={className}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v17H7.5A2.5 2.5 0 0 0 5 22Z" />
          <path d="M5 5.5V19.5A2.5 2.5 0 0 1 7.5 17H19" />
        </IconBase>
      );
    case 'phone':
      return (
        <IconBase className={className}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 17h2" />
        </IconBase>
      );
    case 'plane':
      return (
        <IconBase className={className}>
          <path d="m3 13 18-8-6 14-2.5-4.5L8 12.5 3 13Z" />
        </IconBase>
      );
    case 'bolt':
      return (
        <IconBase className={className}>
          <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" />
        </IconBase>
      );
    case 'camera':
      return (
        <IconBase className={className}>
          <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5Z" />
          <circle cx="12" cy="12.5" r="3" />
        </IconBase>
      );
    case 'ticket':
      return (
        <IconBase className={className}>
          <path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4Z" />
          <path d="M12 4v12" strokeDasharray="2.5 2.5" />
        </IconBase>
      );
    case 'music':
      return (
        <IconBase className={className}>
          <path d="M15 5v10.5a2.5 2.5 0 1 1-2-2.45V7l8-2v8.5a2.5 2.5 0 1 1-2-2.45V3l-4 1.5Z" />
        </IconBase>
      );
    case 'star':
      return (
        <IconBase className={className}>
          <path d="m12 3 2.8 5.67L21 9.58l-4.5 4.38 1.06 6.2L12 17.2l-5.56 2.96 1.06-6.2L3 9.58l6.2-.91L12 3Z" />
        </IconBase>
      );
    default:
      return (
        <IconBase className={className}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </IconBase>
      );
  }
}

export function getCategoryColorValue(color?: string): string {
  if (!color) {
    return DEFAULT_CATEGORY_COLOR_BY_TYPE.expense;
  }

  return color;
}

export function getCategoryColorLabel(color?: string): string {
  return CATEGORY_COLOR_OPTIONS.find((option) => option.value === color)?.label ?? 'Personalizado';
}

export function getCategoryIconLabel(icon?: string): string {
  return CATEGORY_ICON_OPTIONS.find((option) => option.value === icon)?.label ?? 'General';
}
