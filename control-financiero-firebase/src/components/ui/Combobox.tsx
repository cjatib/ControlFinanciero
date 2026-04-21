import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  keywords?: string[] | undefined;
}

interface ComboboxProps {
  label: string;
  description?: string | undefined;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  searchPlaceholder?: string | undefined;
  renderValue?: ((option: ComboboxOption) => ReactNode) | undefined;
  renderOption?: ((option: ComboboxOption, isSelected: boolean) => ReactNode) | undefined;
  emptyState?: string | undefined;
}

export function Combobox({
  label,
  description,
  value,
  options,
  onChange,
  searchPlaceholder = 'Buscar...',
  renderValue,
  renderOption,
  emptyState = 'No encontramos resultados.',
}: ComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, option.value, ...(option.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative space-y-2">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-ink transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/10"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
          if (isOpen) {
            setQuery('');
          }
        }}
      >
        <span className="min-w-0 flex-1">
          {selectedOption && renderValue ? renderValue(selectedOption) : selectedOption?.label ?? 'Selecciona una opcion'}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition', isOpen && 'rotate-180')}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-glow backdrop-blur-xl">
          <div className="border-b border-white/10 p-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-ink outline-none transition placeholder:text-slate-500 focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.length > 0 ? (
              <div className="grid gap-2">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'flex w-full items-center rounded-2xl px-3 py-3 text-left text-sm transition',
                        isSelected ? 'bg-white/10 text-ink' : 'text-slate-300 hover:bg-white/6',
                      )}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setQuery('');
                      }}
                    >
                      {renderOption ? renderOption(option, isSelected) : option.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-4 text-sm text-slate-400">{emptyState}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

