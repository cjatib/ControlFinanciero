# Ajustes visuales del dashboard — ControlFinanciero V2

Rama: `feature/dashboard-compacto-v2`, basada en `main` después del cierre de la V2.
**Alcance exclusivamente visual/de presentación.** No se modifican colecciones Firestore, cálculos de ingresos/gastos, fórmulas de asignación, reglas de seguridad ni Firebase Hosting.

## Cambios

1. Se concentra `Distribución de mi sueldo` y `Objetivos del mes` en un **único panel compacto**, con barra apilada de asignación y barra horizontal de progreso por grupo. Muestra porcentaje asignado, gasto/aporte real, monto presupuestado y disponibilidad/exceso.
2. Se conserva el botón `Editar plan` o `Personalizar plan` y el aviso de plan heredado. También se conservan los avisos para grupos sin categoría, metas sin plan de ahorro y gastos sin asignar.
3. Se eliminó la tarjeta independiente `Ahorro planificado`, que repetía la suma de metas de ahorro. El objetivo sigue siendo el porcentaje del sueldo que corresponda: por ejemplo, 5% + 5% de $1.912.622 son **$191.263** por la distribución de redondeos de los grupos.
4. Se aclara expresamente que el ahorro **asignado** es solo un objetivo, no dinero real. La cifra de **aportes realizados** corresponde exclusivamente a entradas registradas ese mes en planes de ahorro vinculados. Nunca se resta por segunda vez del saldo de movimientos.
5. `Movimientos del mes` se presenta como una lista compacta con iconos y colores reales de categorías, fecha, título y monto alineado a la derecha. Se inspira en la presentación de filas de la referencia visual. No introduce recurrencias ficticias ni marca un movimiento como `pagado`: esos atributos no existen en los documentos de transacciones.
6. La pantalla **Movimientos** reutiliza el componente compacto del dashboard, pero coloca las acciones tras un botón **···** por movimiento. Al tocarlo se despliegan **Editar** y **Eliminar**, sin ocupar espacio permanente ni forzar filas de gran altura. Los controles son táctiles (44 px), están etiquetados para lectores de pantalla y siguen usando el formulario y la confirmación de eliminación originales.

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
- Comprobar que ambas listas comparten iconos, colores, fechas y signos. En **Movimientos**, tocar **···** en distintas filas y verificar que solo se expanda una, que **Editar** abra el registro elegido y **Eliminar** pida confirmación, sin hacer borrados durante las pruebas.
- Comprobar textos largos, montos grandes, botones táctiles, enfoque accesible, barra inferior y desplazamiento hasta la última fila en iPhone. En Movimientos, el botón **Nuevo** está visible en el encabezado y no debe aparecer un segundo botón flotante **+**.

**No fusionar ni publicar en el canal live** antes de validar este cambio desde el canal de preview. El sitio live permanece en la versión V2 actual.

## Ajuste de UX móvil — 25/11/2026

- La cabecera de Movimientos se simplificó: título más breve y acción visible **Nuevo**. La pantalla no utiliza un segundo botón flotante para evitar superposición con filas y acciones.
- Los botones de edición/eliminación ahora son una divulgación accesible por fila (**···**). Solo la fila seleccionada expande la banda de acciones. Los flujos de Firestore no cambiaron.
- La barra de navegación inferior se hizo más compacta, mantiene sus cinco destinos principales y usa `env(safe-area-inset-bottom)` para respetar el área inferior del iPhone. El menú **Más** se reposicionó y ahora se puede cerrar con Escape.
- El atajo flotante para crear un movimiento continúa disponible en las demás pantallas y se oculta cuando está desplegado el menú Más.
- **Pendiente** validar físicamente en Safari iPhone la vista previa actualizada antes de fusionar el PR #2 o publicar Hosting live.

## Historial y Categorías — 25/11/2026

- **Historial:** título y descripción compactos; búsqueda y mes siempre visibles, filtros de **Tipo** y **Categoría** plegables. Un indicador identifica filtros avanzados activos; **Todos los meses** y **Restablecer** evitan desplazamientos innecesarios. Conserva las reglas de filtrado y los totales, que se muestran en dos columnas en móvil con la aclaración de que corresponden a los resultados filtrados.
- **Historial:** la lista usa el mismo `CompactMovementList` que Dashboard/Movimientos. El menú `···` conserva edición y eliminación con el `ConfirmDialog` anterior. Se muestra el número de resultados.
- **Categorías:** encabezado breve y botón **Nueva** integrado, pestañas **Gastos/Ingresos** con número de categorías, lista continua con icono y color personalizado y acciones `···` expandibles. Las funciones para crear/editar/eliminar conservan su formulario y diálogo de confirmación.
- **Navegación:** el botón flotante `+` se oculta en las pantallas del menú **Más** (Historial, Categorías, Reportes, Créditos y Ajustes); permanece en Inicio, Plan y Ahorro. En Movimientos el alta sigue en el encabezado.
- **Sin cambios en Firestore, Auth, reglas, colecciones, totales ni formato de documentos**. El canal live no debe modificarse antes de verificar el preview del PR #2.

### Pruebas manuales de aceptación

1. Historial en iPhone: buscar por categoría/descripcion/monto, elegir otro mes, elegir **Todos los meses**, filtrar por tipo y categoría y **Restablecer**. Los importes y el contador de movimientos deben cambiar coherentemente.
2. Historial: desplegar `···` en un movimiento, comprobar apertura de la edición correcta, cerrar sin cambios; probar que Eliminar muestra el diálogo y **cancelarlo**.
3. Categorías: cambiar entre Gastos e Ingresos, verificar contadores y colores/iconos; abrir `···`, editar sin guardar y cancelar la confirmación de eliminación.
4. Verificar que se puede llegar hasta la última fila de cada lista sin bloqueo de la navegación inferior, y que no hay botón flotante `+` tapando contenido en Historial o Categorías.
5. Repetir en Chrome escritorio, comprobando que los formularios y filtros no rompen la distribución en ancho grande.

Las nuevas pruebas automatizadas `tests/history-filters.test.mjs` protegen la búsqueda, mes, categoría y los totales derivados de los resultados filtrados.
