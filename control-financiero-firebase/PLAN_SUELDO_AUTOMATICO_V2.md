# Plan financiero — base automática desde la categoría «Sueldo»

## Propósito

Separar el **porcentaje distribuido** del **monto base del sueldo**. Los grupos,
sus porcentajes, categorías asociadas y metas de ahorro siguen heredándose del
último presupuesto guardado, mientras que el sueldo base puede obtenerse
automáticamente de Movimientos del mes elegido.

## Fuente de datos

- Solo movimientos de **tipo ingreso** asociados a la categoría llamada
  exactamente **Sueldo** (ignorando mayúsculas y espacios alrededor).
- Se comprueba tanto el identificador de la categoría actual como el nombre
  guardado en el movimiento, para no perder registros cuando se renombra o
  elimina una categoría.
- Si existen dos o más ingresos de Sueldo en el mismo mes, **se suman**.
- **No** se incluyen bonos, devoluciones, otros ingresos ni gastos.
- Se utiliza la **fecha del movimiento**; el sueldo se atribuye al mes de esa
  fecha. El usuario debe registrar el sueldo en el mes que desea presupuestar.

## Reglas de resolución

1. Si el mes seleccionado tiene sueldo registrado, usar su suma como base
   real. Esta regla es la misma cuando luego se consulta ese mes como histórico.
2. Mes actual o futuro, aún sin sueldo registrado: respetar provisionalmente
   un snapshot específico del mes, si existe.
3. Si no hay snapshot específico, usar provisionalmente el último sueldo
   registrado en un mes anterior (no se miran sueldos de meses futuros).
4. Si nunca hubo movimientos Sueldo anteriores, usar provisionalmente la base
   del plan heredado.
5. Si tampoco hay plan, pedir una base manual al crear el primero.
6. Mes histórico sin sueldo registrado: mantener la base del plan guardado o
   heredado. Los meses históricos siguen siendo de **solo lectura** en Plan.

**Importante:** se conservan todos los snapshots existentes en Firestore. El
cálculo del sueldo efectivo es derivado en memoria. Al consultar un mes
histórico con sueldo registrado, se refleja ese sueldo, incluso si su snapshot
original tenía un monto distinto. Solo cambiará el resultado histórico si se
modifica deliberadamente el movimiento Sueldo de ese mes.

## UX

- **Inicio:** el dashboard indica la base efectiva y si proviene de un sueldo
  registrado, un valor provisional o un mes histórico. Se recalculan las barras
  y alertas, sin modificar los ahorros reales.
- **Plan:** permite ver el sueldo efectivo. Cuando se reconoce Sueldo del mes
  actual/futuro, la base se muestra como solo lectura: no se necesita guardar
  nuevamente el plan para actualizar los importes. Mientras sea provisional,
  se permite usar una proyección manual.
- Editar porcentajes/grupos sigue requiriendo guardar un snapshot propio del
  mes. La suma de porcentajes continúa siendo 100 %.

## Seguridad y despliegue

- No se agregan colecciones ni se modifican reglas/servicios de escritura.
- No se ejecutan escrituras al detectar o recalcular salarios.
- No se suma un ingreso extra ni se descuenta el ahorro por segunda vez.
- El PR debe probarse en canal preview HTTPS sobre iPhone/Chrome y fusionarse
  a main solo con autorización. Hosting live permanece intacto.

## Validaciones de aceptación

1. Registrar un sueldo de $2.050.000 en Movimientos/Sueldo en el mes actual:
   Inicio y Plan deben calcular 70 % $1.435.000, 20 % $410.000,
   10 % $205.000, sin guardar el plan.
2. Un bono o una devolución no modifica la base del presupuesto.
3. Cambiar/eliminar sueldo del mes vuelve a calcular la base; el documento
   mensual del plan no se modifica.
4. Avanzar al próximo mes sin sueldo registrado: estado Provisional y último
   sueldo como base; una vez registrado, pasa al importe real.
5. Consultar un mes histórico muestra su propio sueldo, si está registrado;
   no se reescribe ningún snapshot.
6. Los porcentajes, categorías vinculadas, saldos de movimientos y aportes de
   ahorro continúan funcionando sin cambios.
