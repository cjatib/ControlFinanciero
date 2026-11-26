import { useState } from 'react';
import { CompactCategoryList } from '@/components/categories/CompactCategoryList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { CategoryForm } from '@/forms/CategoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/services/categories/categoriesService';
import type { Category, CategoryPayload } from '@/types/category';

export function CategoriesPage() {
  const { user } = useAuth();
  const { categories, loading, error } = useCategories();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);

  if (loading) {
    return <Loader label="Cargando categorias..." />;
  }

  const filteredCategories = categories.filter((category) => category.type === selectedType);

  async function handleCreateOrUpdate(payload: CategoryPayload) {
    if (!user) {
      return;
    }

    if (selectedCategory) {
      await updateCategory(user.uid, selectedCategory.id, payload);
    } else {
      await createCategory(user.uid, payload);
    }

    setModalOpen(false);
    setSelectedCategory(null);
  }

  async function confirmDeleteCategory() {
    if (!user || !categoryPendingDelete) {
      return;
    }

    await deleteCategory(user.uid, categoryPendingDelete.id);
    setCategoryPendingDelete(null);
  }

  function openCreate(type: 'income' | 'expense') {
    setSelectedType(type);
    setSelectedCategory(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Personalización</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Categorías</h1>
          <p className="mt-1 text-xs leading-5 text-slate-400">Organiza cómo clasificas tus movimientos.</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate(selectedType)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-slate-950 transition hover:bg-[#c9d4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nueva
        </button>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#252936] p-1" role="group" aria-label="Tipo de categorías">
        {(['expense', 'income'] as const).map((type) => {
          const count = categories.filter((category) => category.type === type).length;
          const active = selectedType === type;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              className={'flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' +
                (active ? 'bg-accent text-slate-950' : 'text-slate-300 hover:bg-white/10')}
              onClick={() => setSelectedType(type)}
            >
              {type === 'expense' ? 'Gastos' : 'Ingresos'}
              <span className={'rounded-full px-2 py-0.5 text-[11px] font-bold ' +
                (active ? 'bg-slate-950/15' : 'bg-white/10')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <Card className="p-4 text-sm text-rose-200">{error}</Card> : null}

      {filteredCategories.length > 0 ? (
        <CompactCategoryList
          key={selectedType}
          categories={filteredCategories}
          onEdit={(category) => {
            setSelectedCategory(category);
            setModalOpen(true);
          }}
          onDelete={setCategoryPendingDelete}
        />
      ) : (
        <EmptyState
          title={`No hay categorías de ${selectedType === 'income' ? 'ingreso' : 'gasto'}`}
          description="Crea una categoría para mantener tus transacciones organizadas."
          action={<Button onClick={() => openCreate(selectedType)}>Crear categoría</Button>}
        />
      )}

      <Modal
        open={modalOpen}
        title={selectedCategory ? 'Editar categoría' : 'Nueva categoría'}
        description="Asigna un nombre y personaliza su apariencia."
        onClose={() => {
          setModalOpen(false);
          setSelectedCategory(null);
        }}
      >
        <CategoryForm
          initialValue={selectedCategory}
          defaultType={selectedType}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setModalOpen(false);
            setSelectedCategory(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryPendingDelete)}
        title="Eliminar categoria"
        description={
          categoryPendingDelete
            ? `La categoria "${categoryPendingDelete.name}" dejara de estar disponible para futuros movimientos. Si ya la usabas en registros anteriores, revisa si quieres reasignarlos antes de continuar.`
            : ''
        }
        confirmLabel="Si, eliminar"
        onCancel={() => setCategoryPendingDelete(null)}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}
