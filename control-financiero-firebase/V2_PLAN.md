# ControlFinanciero V2 — Presupuestos mensuales

## Seguridad y compatibilidad

Esta fase agrega solo la colección `users/{uid}/monthlyBudgets/{YYYY-MM}`. No modifica ni elimina transacciones, categorías, créditos ni ahorros existentes.
Cada documento contiene `month`, `incomeAmount`, `groups`, `createdAt` y `updatedAt`. El sueldo base configura límites, no crea un ingreso.
Cada mes se guarda por separado. Si el mes no tiene plan propio, se muestra automáticamente el último plan guardado de un mes anterior (solo lectura; no se crea un documento). Si no existe ninguno, aparece una propuesta editable 50/30/20. Al modificar y guardar, se crea un documento exclusivo para el mes seleccionado sin modificar otros documentos mensuales. Los meses heredados que aún no tienen un documento propio reflejan la última versión del plan anterior hasta que se personalicen.
Se permiten entre 1 y 100 grupos. Los porcentajes deben sumar exactamente 100%; una categoría de gasto no puede pertenecer a dos grupos, ni un plan de ahorro vincularse a dos grupos el mismo mes.
Los gastos se calculan desde las transacciones existentes; los ahorros reales, desde las entradas de los planes. Los aportes de ahorro NO se descuentan otra vez del saldo de movimientos.

## Prueba local

Desde la rama `feature/control-financiero-v2` y la carpeta `control-financiero-firebase`, con Node >=24.12.0, ejecutar `npm ci`, `npm run build` y `npm run dev -- --host 0.0.0.0`.

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
6. Seleccionar diciembre tras guardar noviembre y comprobar que el plan de noviembre se aplica automáticamente sin tener que crearlo de nuevo. Después cambiar diciembre y guardar, y comprobar que noviembre conserva sus porcentajes.
7. Intentar guardar un porcentaje total distinto de 100 y un plan de ahorro duplicado; se debe impedir.
8. Verificar comportamiento en Safari para iPhone, navegación y teclado.

## Pendientes antes de fusionar

Construir con npm y completar las pruebas anteriores. Revisar las 4 alertas altas de dependencias de producción @grpc/grpc-js/Firestore reportadas en la auditoría previa. No ejecutar npm audit fix --force automáticamente.
La rama y el PR permanecen separados de main. La publicación de reglas y el despliegue en producción requieren validación independiente.
