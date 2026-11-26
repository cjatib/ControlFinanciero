import { useId, useState } from 'react';
import { EditIcon, TrashIcon } from '@/components/ui/ActionIconButton';
import {
  CategoryGlyph, getCategoryColorValue, getCategoryColorLabel, getCategoryIconLabel,
} from '@/lib/categoryAppearance';
import type { Category } from '@/types/category';

interface CompactCategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

export function CompactCategoryList({ categories, onEdit, onDelete }: CompactCategoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const idPrefix = useId();

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1d2027] px-3 shadow-glow sm:px-5">
      <ul className="divide-y divide-white/10" aria-label="Categorías registradas">
        {categories.map((category) => {
          const color = getCategoryColorValue(category.color);
          const expanded = expandedId === category.id;
          const panelId = idPrefix + '-category-actions-' + category.id;
          return (
            <li key={category.id} className="min-w-0 py-3 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    color,
                    borderColor: color + '55',
                    backgroundColor: color + '1c',
                  }}
                >
                  <CategoryGlyph icon={category.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink sm:text-[15px]" title={category.name}>
                    {category.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {getCategoryIconLabel(category.icon)} · {getCategoryColorLabel(category.color)}
                  </p>
                </div>
                <button
                  type="button"
                  className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
                    (expanded ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-white/10 hover:text-ink')}
                  onClick={() => setExpandedId(expanded ? null : category.id)}
                  aria-label={'Opciones de la categoría ' + category.name}
                  aria-expanded={expanded}
                  aria-controls={expanded ? panelId : undefined}
                  title="Editar o eliminar"
                >
                  <MoreIcon />
                </button>
              </div>

              {expanded ? (
                <div id={panelId} className="mt-2 flex flex-wrap justify-end gap-2 border-t border-white/5 pt-2">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 text-xs font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    aria-label={'Editar categoría ' + category.name}
                    onClick={() => {
                      setExpandedId(null);
                      onEdit(category);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 text-xs font-semibold text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
                    aria-label={'Eliminar categoría ' + category.name}
                    onClick={() => {
                      setExpandedId(null);
                      onDelete(category);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
