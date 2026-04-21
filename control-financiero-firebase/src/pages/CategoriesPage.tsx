import { useState } from 'react';
import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { CategoryForm } from '@/forms/CategoryForm';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import {
  CategoryGlyph,
  getCategoryColorLabel,
  getCategoryColorValue,
  getCategoryIconLabel,
} from '@/lib/categoryAppearance';
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
      <PageHeader
        eyebrow="Categorias"
        title="Organiza tus movimientos"
        description="Crea categorias personalizadas para ingresos y gastos. Todo queda guardado bajo tu uid."
        action={<Button onClick={() => openCreate(selectedType)}>Nueva categoria</Button>}
      />

      <div className="flex rounded-3xl border border-white/10 bg-white/5 p-1">
        {(['expense', 'income'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={`flex-1 rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition ${
              selectedType === type ? 'bg-white/10 text-ink' : 'text-slate-400'
            }`}
            onClick={() => setSelectedType(type)}
          >
            {type === 'expense' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>

      {error ? <Card className="p-5 text-sm text-rose-200">{error}</Card> : null}

      {filteredCategories.length > 0 ? (
        <div className="grid gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
                    style={{ color: getCategoryColorValue(category.color) }}
                  >
                    <CategoryGlyph icon={category.icon} className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-ink">{category.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                      {category.type === 'income' ? 'Ingreso' : 'Gasto'} • {getCategoryIconLabel(category.icon)} •{' '}
                      {getCategoryColorLabel(category.color)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <ActionIconButton
                    tone="edit"
                    aria-label={`Editar categoria ${category.name}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setModalOpen(true);
                    }}
                  />
                  <ActionIconButton
                    tone="delete"
                    aria-label={`Eliminar categoria ${category.name}`}
                    onClick={() => setCategoryPendingDelete(category)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No hay categorias de ${selectedType === 'income' ? 'ingreso' : 'gasto'}`}
          description="Crea categorias personalizadas para mantener tus transacciones ordenadas."
          action={<Button onClick={() => openCreate(selectedType)}>Crear categoria</Button>}
        />
      )}

      <Modal
        open={modalOpen}
        title={selectedCategory ? 'Editar categoria' : 'Nueva categoria'}
        description="Define el tipo, nombre, color e icono para reutilizarla en tus transacciones."
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
