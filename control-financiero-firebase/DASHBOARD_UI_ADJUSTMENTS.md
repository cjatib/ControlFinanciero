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

## Ahorro y Créditos — 25/11/2026

- Ahorro: se sustituyeron las tres tarjetas individuales del resumen por **una sola tarjeta compacta**, con meta mensual total, saldo acumulado real y cantidad de planes. No se presentan esos montos como si fueran equivalentes: una meta mensual no es un ahorro acumulado.
- Ahorro: cabecera breve con **Nuevo plan**; los planes aparecen en una lista única con nombre, número de aportes, meta mensual, saldo real y acceso **Ver aportes y registrar ahorro**. Las acciones de edición y borrado están bajo **···** con confirmación original.
- Créditos: resumen consolidado de saldo pendiente y total abonado, con recuentos de créditos activos y cuotas. Se mantiene la lógica existente de cálculo de saldos, estados, fechas y cuotas.
- Créditos: cabecera breve con **Nuevo**, listado continuo con estado, cuotas registradas, montos y progreso horizontal. Acceso **Ver cuotas y registrar pago** por crédito. Las opciones **···** conservan edición y eliminación.
- En las ventanas de detalle de ambas secciones, métricas compactas de dos columnas y aportes/cuotas como filas con menú contextual sin botones grandes permanentes.
- En Ahorro se oculta el botón flotante global porque el mismo alta está disponible en el encabezado. En Créditos ya estaba oculto por ser una sección secundaria.
- No cambian Firebase Auth, Firestore, reglas, cálculos financieros, permisos, funciones de creación/edición/eliminación, ni el frontend publicado en `live`.

### Pruebas manuales antes de integrar el PR #2

1. Ahorro en iPhone: comprobar resumen, metas acumuladas y nombre largo de plan; abrir detalle y registrar o editar aportes solo con movimientos controlados, o abrir y cancelar formularios sin modificar datos.
2. Confirmar que el botón **Nuevo plan** funciona, que la opción **···** muestra Editar y Eliminar, y que Eliminar sigue solicitando confirmación.
3. Créditos: comprobar saldos, estatus Activo/Vencido/Pagado, cuotas y fecha del próximo vencimiento con casos existentes; abrir detalles, formulario de abono y cancelación de eliminación.
4. Comprobar la navegación inferior y el desplazamiento hasta el último registro en Ahorro y Créditos, sin superposición del botón flotante.
5. Revalidar Historial y Categorías en el mismo despliegue, así como Dashboard y Movimientos. No fusionar ni desplegar `live` sin autorización expresa.

## Formularios de creación/edición — 26/11/2026

**Objetivo:** adoptar una única experiencia para los formularios de nuevas transacciones, categorías, créditos, planes de ahorro, aportes y cuotas. Corresponde a la revisión visual del usuario en iPhone.

- El modal compartido tiene un encabezado compacto, botón de cierre **X** accesible, áreas de desplazamiento y padding seguro para la barra inferior del iPhone; el footer externo de transacciones se mantiene fijo y se asocia al formulario con `form=transaction-editor`.
- Todos los formularios usan espaciado más denso y controles táctiles de 44 px, sin fuentes inferiores a 16 px en campos nativos para evitar el zoom involuntario de iOS.
- Se centralizaron los botones de acción en `FormActions`: primaria **Guardar/Crear/Registrar**, secundaria **Cancelar**, indicador **Guardando…** y bloqueo mientras se procesa la petición.
- El tipo **Gasto/Ingreso** se presenta como selector segmentado en transacciones y categorías. Las opciones de color e icono de Categorías se expanden dentro del scroll del modal en móvil en vez de quedar cortadas.
- La descripción o nota opcional aparece como una sección desplegable. Al editar un documento que ya contiene descripción se muestra abierta. Colapsar **nunca borra el texto guardado en el estado del formulario**.
- Crédito: monto y cantidad de cuotas comparten una fila compacta; la fecha del primer vencimiento mantiene el selector nativo. Las reglas de validación de montos, cuotas y fechas no cambian.
- Los registros de ahorro/cuotas conservan las comprobaciones financieras y muestran un resumen de crédito más compacto.
- `Plan`: se compactó únicamente el control **+ Agregar grupo**. No se altera la composición del plan, los porcentajes ni la validación del 100 %.
- **Ninguna modificación de Firebase Auth, Firestore, reglas, servicios ni operaciones de escritura.** La versión publicada en `live` permanece intacta hasta nueva autorización.

### Aceptación manual de los formularios

1. iPhone: entrar a **Movimientos → Nuevo**, elegir Gasto e Ingreso, registrar monto/categoría/fecha; abrir nota opcional, cerrar sin guardar y editar uno existente. Comprobar que los valores no desaparecen al abrir/cerrar la nota.
2. **Categorías → Nueva**: comprobar cambio Gasto/Ingreso, color, icono, búsqueda dentro del selector y desplazamiento completo hasta Guardar. Cerrar sin grabar.
3. **Ahorro → Nuevo plan** y **Registrar ahorro** desde un detalle: comprobar campos, notas plegables, botones y conservación de contenido al editar.
4. **Créditos → Nuevo** y **Registrar cuota**: comprobar campos numéricos en dos columnas, calendario, límites de monto y validación. Cancelar antes de escribir datos reales.
5. Verificar que el teclado iOS no tape el campo activo, que Guardar/Cancelar sea alcanzable, y que cerrar con X o Escape restaure el foco sin saltos en Chrome.
6. Repetir pruebas en escritorio; confirmar que el diseño del modal se mantiene legible y accesible.

Pruebas: `tests/form-ux.test.mjs` garantiza que los seis formularios utilicen los componentes comunes y que las notas existentes se desplieguen en edición. **Los tests de código y compilación no sustituyen la prueba visual real en iPhone.**
