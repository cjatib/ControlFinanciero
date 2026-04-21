import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  CategoryGlyph,
  DEFAULT_CATEGORY_COLOR_BY_TYPE,
  DEFAULT_CATEGORY_ICON_BY_TYPE,
  getCategoryColorLabel,
  getCategoryIconLabel,
} from '@/lib/categoryAppearance';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateRequired } from '@/utils/validators';
import type { Category, CategoryPayload } from '@/types/category';

interface CategoryFormProps {
  initialValue?: Category | null;
  defaultType?: CategoryPayload['type'];
  onSubmit: (payload: CategoryPayload) => Promise<void>;
  onCancel: () => void;
}

interface CategoryState {
  name: string;
  type: CategoryPayload['type'];
  color: string;
  icon: string;
}

export function CategoryForm({ initialValue, defaultType = 'expense', onSubmit, onCancel }: CategoryFormProps) {
  const [formState, setFormState] = useState<CategoryState>({
    name: initialValue?.name ?? '',
    type: initialValue?.type ?? defaultType,
    color: initialValue?.color ?? DEFAULT_CATEGORY_COLOR_BY_TYPE[defaultType],
    icon: initialValue?.icon ?? DEFAULT_CATEGORY_ICON_BY_TYPE[defaultType],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CategoryState, string>> = {};
    const nameError = validateRequired(formState.name, 'nombre');

    if (nameError) {
      nextErrors.name = nameError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: formState.name,
        type: formState.type,
        color: formState.color,
        icon: formState.icon,
      });
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input
        id="category-name"
        label="Nombre"
        placeholder="Ej. Sueldo, Arriendo, Transporte"
        value={formState.name}
        error={errors.name}
        onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
      />

      <Select
        id="category-type"
        label="Tipo"
        value={formState.type}
        onChange={(event) =>
          setFormState((current) => {
            const nextType = event.target.value as CategoryPayload['type'];
            const nextColor =
              current.color === DEFAULT_CATEGORY_COLOR_BY_TYPE[current.type]
                ? DEFAULT_CATEGORY_COLOR_BY_TYPE[nextType]
                : current.color;
            const nextIcon =
              current.icon === DEFAULT_CATEGORY_ICON_BY_TYPE[current.type]
                ? DEFAULT_CATEGORY_ICON_BY_TYPE[nextType]
                : current.icon;

            return {
              ...current,
              type: nextType,
              color: nextColor,
              icon: nextIcon,
            };
          })
        }
      >
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
      </Select>

      <Combobox
        label="Color"
        description="Selecciona un color desde una lista compacta."
        value={formState.color}
        options={CATEGORY_COLOR_OPTIONS.map((option) => ({
          ...option,
          keywords: [option.label, option.value],
        }))}
        searchPlaceholder="Buscar color"
        emptyState="No encontramos colores con ese nombre."
        onChange={(value) => setFormState((current) => ({ ...current, color: value }))}
        renderValue={(option) => (
          <span className="flex items-center gap-3">
            <span
              className="h-5 w-5 rounded-full border border-white/10"
              style={{ backgroundColor: option.value }}
            />
            <span className="font-medium text-ink">{option.label}</span>
          </span>
        )}
        renderOption={(option, isSelected) => (
          <span className="flex w-full items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <span
                className="h-5 w-5 rounded-full border border-white/10"
                style={{ backgroundColor: option.value }}
              />
              <span>{option.label}</span>
            </span>
            {isSelected ? <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Actual</span> : null}
          </span>
        )}
      />

      <Combobox
        label="Icono"
        description="Elige un icono visual desde un dropdown compacto."
        value={formState.icon}
        options={CATEGORY_ICON_OPTIONS.map((option) => ({
          ...option,
          keywords: [option.label, option.value],
        }))}
        searchPlaceholder="Buscar icono"
        emptyState="No encontramos iconos con ese nombre."
        onChange={(value) => setFormState((current) => ({ ...current, icon: value }))}
        renderValue={(option) => (
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
              <CategoryGlyph icon={option.value} className="h-4 w-4" />
            </span>
            <span className="font-medium text-ink">{option.label}</span>
          </span>
        )}
        renderOption={(option, isSelected) => (
          <span className="flex w-full items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
                <CategoryGlyph icon={option.value} className="h-4 w-4" />
              </span>
              <span>{option.label}</span>
            </span>
            {isSelected ? <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Actual</span> : null}
          </span>
        )}
      />

      {submitError ? <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-rose-200">{submitError}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" fullWidth size="lg" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button fullWidth size="lg" type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : initialValue ? 'Actualizar categoria' : 'Crear categoria'}
        </Button>
      </div>
    </form>
  );
}
