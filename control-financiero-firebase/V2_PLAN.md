# ControlFinanciero V2 — Presupuestos mensuales

## Seguridad y compatibilidad

Esta fase agrega solo la colección `users/{uid}/monthlyBudgets/{YYYY-MM}`. No modifica ni elimina transacciones, categorías, créditos ni ahorros existentes.
Cada documento contiene `month`, `incomeAmount`, `groups`, `createdAt` y `updatedAt`. El sueldo base configura límites, no crea un ingreso.
Cada mes se guarda por separado. Si el mes no tiene plan propio, se muestra automáticamente el último plan guardado de un mes anterior (solo lectura; no se crea un documento). Si no existe ninguno, aparece una propuesta editable 50/30/20. Al modificar y guardar, se crea un documento exclusivo para el mes seleccionado sin modificar otros documentos mensuales. Los meses anteriores se muestran en modo consulta y la aplicación impide guardarlos o cambiarlos retroactivamente. Por ejemplo, en enero una nueva versión del plan afecta enero y los meses futuros que la hereden, pero diciembre conserva el plan que estuvo vigente. Solo los meses actuales o futuros pueden personalizarse; la seguridad de esta restricción depende del cliente (las reglas actuales siguen permitiendo escrituras del dueño autenticado).
Se permiten entre 1 y 100 grupos. Los porcentajes deben sumar exactamente 100%; una categoría de gasto no puede pertenecer a dos grupos, ni un plan de ahorro vincularse a dos grupos el mismo mes.
Los gastos se calculan desde las transacciones existentes; los ahorros reales, desde las entradas de los planes. Los aportes de ahorro NO se descuentan otra vez del saldo de movimientos.

## Prueba local

Desde la rama `feature/control-financiero-v2` y la carpeta `control-financiero-firebase`, con Node >=24.12.0, ejecutar `npm ci`, `npm run test:budget`, `npm run build` y `npm run dev -- --host 0.0.0.0`.

## Publicación de reglas de Firestore — acción manual aparte

Antes de probar el módulo Plan, debes publicar las reglas nuevas para que Firebase autorice leer y guardar `monthlyBudgets`.
Usar preferentemente un proyecto Firebase DE DESARROLLO con datos de prueba. Antes de publicar en producción, respaldar Firestore y comparar las reglas vigentes en la consola para no pisar cambios externos.

Desde `control-financiero-firebase`:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project TU_ID_DE_PROYECTO_DE_PRUEBAS
```

El archivo firebase.json apunta solamente a firestore.rules; no se despliega Hosting ni se migran datos.

## Pruebas funcionales

1. Iniciar sesión y verificar que Historial, Créditos y Ahorros sigan visibles. Si se prueba en PRD, no crear ni eliminar movimientos históricos para realizar estas pruebas.
2. En Plan, crear varios grupos con porcentajes que sumen 100, vincular distintas categorías y un plan de ahorro y guardar.
3. En Inicio, comprobar los montos de ingresos, gastos, saldo de movimientos y presupuesto mensual.
4. Registrar, editar y eliminar un gasto de prueba vinculado a un grupo y verificar el progreso.
5. Crear un aporte de prueba a un plan vinculado y comprobar que incrementa la meta de ahorro sin descontarlo dos veces del saldo.
6. Seleccionar diciembre tras guardar noviembre y comprobar que el plan de noviembre se aplica automáticamente sin tener que crearlo de nuevo. En diciembre, al cambiar y guardar, noviembre conserva sus porcentajes. Al llegar enero, crear otro plan: diciembre debe continuar con sus propios valores y quedar solo de lectura.
7. Intentar guardar un porcentaje total distinto de 100 y un plan de ahorro duplicado; se debe impedir.
8. Verificar comportamiento en Safari para iPhone, navegación y teclado. En Movimientos, seleccionar una categoría en el modal y confirmar que permanece seleccionada y que no aparece `Maximum update depth exceeded` en la consola.

## Pendientes antes de fusionar

Construir con npm y completar las pruebas anteriores. Revisar las 4 alertas altas de dependencias de producción @grpc/grpc-js/Firestore reportadas en la auditoría previa. No ejecutar npm audit fix --force automáticamente.
La rama y el PR permanecen separados de main. La publicación de reglas y el despliegue en producción requieren validación independiente.

## Dashboard V2 — análisis financiero (fase siguiente)

- Comparación de ingresos y gastos con el mes inmediatamente anterior (usa fechas de transacciones, no presupuestos). Si el mes anterior no tiene importe de referencia, se muestra "Sin referencia", no un porcentaje ficticio.
- Distribución de gastos por categoría (las cinco de mayor importe), mostrando monto, cantidad de movimientos y proporción del gasto total.
- Resumen de presupuesto **solo de grupos de gasto**: monto asignado, consumido y disponible, sin sumar los objetivos de ahorro. Los gastos no asignados se notifican aparte; sí permanecen en el saldo mensual.
- Alertas visuales al alcanzar 80 % de ejecución de cada grupo de gasto y cuando supera 100 %. El saldo de movimientos sigue siendo ingresos menos gastos registrados, no saldo bancario.
- Las métricas se calculan solo en la interfaz; no hay nuevas colecciones ni cambios en las reglas de Firebase.

### Pruebas

Ejecutar `npm test` y `npm run build` desde la carpeta `control-financiero-firebase`. Comprobar en móvil que las tarjetas se adaptan a la pantalla, el orden de las principales categorías es correcto y las alertas aparecen y desaparecen cuando se modifican transacciones. No es necesario publicar reglas nuevas.

## Fase 4 — Reportes históricos (solo lectura)

Ruta: **Más → Reportes** o el acceso «Ver reportes históricos» desde el dashboard. Esta sección no reemplaza Historial, que mantiene el detalle y la edición de movimientos.

- Seleccionar un mes de cierre y un período de 6, 12 o 24 meses. Se incluyen todos los meses calendario del rango, incluso aquellos sin movimientos.
- Gráfico comparativo de **ingresos y gastos** según la fecha de las transacciones.
- Gráfico independiente de **aportes al ahorro**, por fecha de entrada en los planes que todavía existen. No usa el acumulado global savedAmount como ahorro del mes; no descuenta aportes del balance.
- Resumen de ingresos, gastos, ahorro, balance de movimientos, promedios mensuales y cantidad de registros.
- Cinco principales categorías de gasto del período y tabla de importes exactos por mes.
- Gráficos desplazables horizontalmente en teléfonos, con montos exactos disponibles en la tabla.
- Firestore se consulta con los permisos existentes para las subcolecciones de cada plan de ahorro; no usa collectionGroup ni necesita modificar reglas de seguridad.
- No hay nuevas escrituras ni migraciones de datos.

### Validaciones

Ejecutar `npm test` y `npm run build`. Probar **Más → Reportes** en navegador e iPhone, cambiar 6/12/24 meses y comprobar el cambio de año de diciembre a enero. Revisar que los meses sin operaciones aparezcan con cero, que los aportes de ahorro coincidan con los planes actuales y que el balance sea ingresos menos gastos. Los aportes de planes eliminados previamente no son recuperables en este reporte.

## Fase 5 — Exportación de reportes y optimización móvil

- **Más → Reportes → Descargar CSV (Excel)** descarga el período seleccionado con ingresos, gastos, aportes de ahorro, balance y cantidad de registros por mes, más totales y desglose por categorías. Usa CSV UTF-8 con BOM y delimitador `;` compatible con configuraciones regionales chilenas; importes numéricos sin separador de miles para facilitar cálculos.
- El generador CSV sanea textos que podrían interpretarse como fórmulas de Excel; conserva los valores negativos de balance como números.
- **Imprimir / Guardar PDF** utiliza la función de impresión nativa del navegador y una hoja de estilo A4 para visualizar el reporte. En escritorio seleccionar **Guardar como PDF** como destino. En Safari iPhone las opciones pueden variar; usar Compartir / Imprimir y la función de guardar PDF del sistema si está disponible.
- La exportación se genera localmente dentro del navegador desde los datos ya cargados. No se envían movimientos financieros a otros servicios y no se crean archivos en Firebase.
- Las exportaciones se deshabilitan cuando el reporte es inválido, está incompleto o falla la consulta a Firestore.
- Carga diferida (lazy routes) de las pantallas secundarias para reducir el código necesario al entrar a Inicio; se eliminó la agrupación forzada de todas las dependencias Firebase en un único archivo. No se modificaron versiones de dependencias.

### Validación

Desde control-financiero-firebase ejecutar `npm test` y `npm run build`. En Chrome y Safari iPhone abrir Reportes, cambiar 6/12/24 meses, descargar CSV, confirmar caracteres con tilde y montos numéricos, probar saldos negativos y usar Imprimir / Guardar PDF. Después navegar entre Inicio, Movimientos, Plan, Ahorro y Más para verificar que la carga diferida no afecte rutas o formularios. Comparar el tamaño de los recursos iniciales en DevTools Network antes/después si se necesita cuantificar el rendimiento.

El despliegue de reglas Firestore no es necesario: esta fase no introduce colecciones ni operaciones de escritura.

## Corrección de exportación PDF en iPhone (fase 5.1)

El botón anterior dependía de `window.print()`, que no ofrece una salida fiable al usar Safari móvil o una PWA instalada. Se conserva la impresión de escritorio, pero **Guardar / Compartir PDF** ahora genera un archivo PDF A4 multipágina real en memoria (no HTML) y permite guardarlo desde el dispositivo.

- El PDF incluye ingresos, gastos, aportes, balance y tabla mensual, además de principales categorías de gasto. Se genera localmente, sin enviar información a servicios externos.
- En iOS con HTTPS y soporte `navigator.canShare({files})`, el botón abre la hoja nativa de Compartir para seleccionar **Guardar en Archivos**.
- En acceso por IP local usando HTTP (`http://192.168.x.x:5173`) la Web Share API no está disponible por falta de contexto seguro; el mismo botón descarga el `.pdf` mediante Blob, como ya hace el CSV. Desde Safari, el archivo puede localizarse en Descargas y guardarse en Archivos.
- Si el usuario cancela el menú Compartir, no se inicia otra descarga. Si compartir falla por un error técnico, intenta descarga directa.
- La opción **Imprimir (escritorio)** conserva el comportamiento previo, con hoja de estilos A4.
- Usa fuentes estándar PDF con caracteres españoles Windows-1252. El documento no incluye los gráficos SVG de la vista web; prioriza los montos exactos y la legibilidad de la tabla en móvil.

### Pruebas de regresión

Ejecutar `npm test`, `npm run build`, entrar a Reportes y probar **Guardar / Compartir PDF** tanto desde Safari iPhone como desde Chrome; verificar que el fichero `.pdf` se abre y muestra todas sus páginas, especialmente al escoger 24 meses. En iPhone por HTTP buscar el PDF en **Descargas** y usar Compartir/Guardar en Archivos. Confirmar que CSV mantiene el mismo comportamiento.
