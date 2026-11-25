# Ajustes visuales del dashboard — ControlFinanciero V2

Rama: `feature/dashboard-compacto-v2`, basada en `main` después del cierre de la V2.
**Alcance exclusivamente visual/de presentación.** No se modifican colecciones Firestore, cálculos de ingresos/gastos, fórmulas de asignación, reglas de seguridad ni Firebase Hosting.

## Cambios

1. Se concentra `Distribución de mi sueldo` y `Objetivos del mes` en un **único panel compacto**, con barra apilada de asignación y barra horizontal de progreso por grupo. Muestra porcentaje asignado, gasto/aporte real, monto presupuestado y disponibilidad/exceso.
2. Se conserva el botón `Editar plan` o `Personalizar plan` y el aviso de plan heredado. También se conservan los avisos para grupos sin categoría, metas sin plan de ahorro y gastos sin asignar.
3. Se eliminó la tarjeta independiente `Ahorro planificado`, que repetía la suma de metas de ahorro. El objetivo sigue siendo el porcentaje del sueldo que corresponda: por ejemplo, 5% + 5% de $1.912.622 son **$191.263** por la distribución de redondeos de los grupos.
4. Se aclara expresamente que el ahorro **asignado** es solo un objetivo, no dinero real. La cifra de **aportes realizados** corresponde exclusivamente a entradas registradas ese mes en planes de ahorro vinculados. Nunca se resta por segunda vez del saldo de movimientos.
5. `Movimientos del mes` se presenta como una lista compacta con iconos y colores reales de categorías, fecha, título y monto alineado a la derecha. Se inspira en la presentación de filas de la referencia visual. No introduce recurrencias ficticias ni marca un movimiento como `pagado`: esos atributos no existen en los documentos de transacciones.
6. La pantalla **Movimientos** ahora reutiliza el mismo componente de filas compactas que el dashboard, con iconos, colores, nombres, fechas y montos consistentes. Los botones **Editar** y **Eliminar** se mantienen a la derecha, con tamaños táctiles adecuados para iPhone. Solo cambia su presentación, no el flujo de edición, confirmación de eliminación ni los datos.

## Pruebas

```bash
git switch feature/dashboard-compacto-v2
npm ci
npm test
npm run build
npm run test:pwa-build
```

Los nuevos tests en `tests/dashboard-savings.test.mjs` comprueban que el objetivo de ahorro no sea considerado ahorro efectivo ni contado como gasto, incluidos los redondeos del sueldo de ejemplo.

## Validación visual previa a producción

- Desde Chrome de escritorio y Safari iPhone, comprobar que los cuatro grupos (70%, 20%, 5%, 5%) aparecen en una lista compacta con barras horizontales.
- Comprobar que no aparecen los encabezados duplicados `Objetivos del mes` ni `Ahorro planificado`.
- Revisar que una meta sin aporte muestre el objetivo y $0 realmente aportados, y un grupo excedido se señale claramente.
- Verificar que `Editar plan` abra el mes correcto y no cambie datos hasta que se guarde en la pantalla Plan.
- Comprobar que tanto **Movimientos del mes** como la pantalla **Movimientos** usan los mismos iconos, colores, fechas y signos. En la segunda, verificar que **Editar** abre el formulario con el movimiento elegido y que **Eliminar** exige confirmación.
- Comprobar contraste, textos largos, botones de acciones y barra de navegación inferior en iPhone.

**No fusionar ni publicar en el canal live** antes de validar este cambio desde el canal de preview. El sitio live permanece en la versión V2 actual.
