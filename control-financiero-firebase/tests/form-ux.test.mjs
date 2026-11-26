import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (file) => readFile(path.join(root, 'src', file), 'utf8');

test('all six creation/editing forms share accessible compact actions', async () => {
  const forms = [
    'forms/TransactionForm.tsx',
    'forms/CategoryForm.tsx',
    'forms/SavingsPlanForm.tsx',
    'forms/CreditForm.tsx',
    'forms/SavingsEntryForm.tsx',
    'forms/CreditInstallmentForm.tsx',
  ];
  for (const file of forms) {
    const content = await source(file);
    assert.match(content, /<FormActions\b/, file + ' has no shared primary/cancel actions');
    assert.match(content, /className="space-y-3\.5"/, file + ' should use compact spacing');
  }
});

test('optional details preserve existing descriptions on edit and store the draft in parent state', async () => {
  const component = await source('components/ui/OptionalDetails.tsx');
  assert.match(component, /useState\(defaultOpen\)/);
  assert.doesNotMatch(component, /onChange\(|setFormState\(/);
  for (const file of [
    'forms/TransactionForm.tsx',
    'forms/CreditForm.tsx',
    'forms/SavingsEntryForm.tsx',
    'forms/CreditInstallmentForm.tsx',
  ]) {
    const content = await source(file);
    assert.match(content, /<OptionalDetails[^>]+defaultOpen=\{Boolean\(initialValue\?\.description\?\.trim\(\)\)\}/,
      file + ' must reveal an existing description on edit');
  }
});

test('transaction editor retains fixed save action and form association', async () => {
  const page = await source('pages/TransactionsPage.tsx');
  const form = await source('forms/TransactionForm.tsx');
  assert.match(page, /form="transaction-editor"/);
  assert.match(page, /footer=\{/);
  assert.match(form, /id=\{formId\}/);
  assert.match(form, /\{!hideActions \?/);
});

test('modal has iPhone safe-area handling, close label and dialog focus isolation', async () => {
  const modal = await source('components/ui/Modal.tsx');
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /aria-label="Cerrar sin guardar"/);
  assert.match(modal, /env\(safe-area-inset-bottom\)/);
  assert.match(modal, /document\.querySelectorAll\('\[role="dialog"\]\[aria-modal="true"\]'\)/);
});

test('category choices remain scrollable within the mobile modal', async () => {
  const combobox = await source('components/ui/Combobox.tsx');
  assert.match(combobox, /className="relative z-30/);
  assert.match(combobox, /sm:absolute/);
  assert.match(combobox, /max-h-48 overflow-y-auto/);
  assert.match(combobox, /data-combobox-expanded/);
  const modal = await source('components/ui/Modal.tsx');
  assert.match(modal, /querySelector\('\[data-combobox-expanded="true"\]'\)/);
});

test('all four primary creation forms open centered on iPhone', async () => {
  const cases = [
    ['pages/TransactionsPage.tsx', 'description="Registra el monto, la categoría y la fecha."'],
    ['pages/CategoriesPage.tsx', 'description="Asigna un nombre y personaliza su apariencia."'],
    ['pages/CreditsPage.tsx', 'description="Indica el monto, las cuotas y el primer vencimiento."'],
    ['pages/SavingsPage.tsx', 'description="Establece el nombre y la meta mensual."'],
  ];
  for (const [file, description] of cases) {
    const page = await source(file);
    const start = page.indexOf(description);
    assert.ok(start >= 0, file + ' missing creation modal description');
    const tagEnd = page.indexOf('\n      >', start);
    assert.ok(tagEnd > start, file + ' missing modal opening tag');
    const props = page.slice(start, tagEnd);
    assert.match(props, /\n\s+centered(?:\s|$)/, file + ' creation form must be vertically centered');
  }
  const modal = await source('components/ui/Modal.tsx');
  assert.match(modal, /centered \? 'items-center/);
  assert.match(modal, /maxHeight: 'calc\(100dvh/);
  assert.match(modal, /overflow-y-auto overscroll-contain/);
});
