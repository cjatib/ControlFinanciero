# ControlFinanciero V2 — Checklist de publicación definitiva

> Fase 9 · preparado el 9 de noviembre de 2026. Este documento **no autoriza** desplegar Hosting live ni fusionar la rama main. La publicación definitiva requiere aprobación expresa.

## 1. Identidad de la versión candidata

| Elemento | Valor |
| --- | --- |
| Repositorio | `cjatib/ControlFinanciero` |
| Rama V2 | `feature/control-financiero-v2` |
| PR | https://github.com/cjatib/ControlFinanciero/pull/1 |
| Rama estable | `main` (no fusionada) |
| Proyecto Firebase | `control-financiero-49b07` (Spark) |
| Canal HTTPS de pruebas | `v2-pruebas` |
| Canal final | `live` (NO publicado en esta fase) |
| Firebase | `13.2.0` |
| Vite | `6.4.5` |
| Dependencia gRPC corregida | `@grpc/grpc-js@1.14.7` |

**Congelación de código:** la V2 del canal `v2-pruebas` fue probada por el usuario en HTTPS desde iPhone y Chrome. A partir de la aprobación, no reconstruir para live: **clonar la versión exacta de `v2-pruebas` hacia `live`**. Si se modifica código del frontend antes de publicarlo, volver a desplegar el canal de pruebas y repetir las validaciones.

## 2. Evidencia ya completada

- [x] Dashboard V2, distribución mensual y herencia por mes, selección de categorías y movimientos.
- [x] Reportes históricos; CSV exportable desde Chrome/iPhone.
- [x] PDF generado en iPhone y escritorio.
- [x] Aviso PWA por HTTPS; «Actualizar ahora» recarga y «Más tarde» oculta el aviso sin recarga.
- [x] Versión HTTPS disponible y funcionamiento general verificado por el usuario tras las mejoras de fase 8.
- [x] Auditoría npm completa sin vulnerabilidades moderadas o superiores al cierre de fase 8.
- [x] Pruebas automatizadas, compilación, worker versionado y reglas Firestore compiladas en emulador.
- [ ] Confirmación final de que `v2-pruebas` conserva la misma versión funcional y Hosting `live` no cambió externamente.
- [ ] Evidencia de versión anterior de Hosting live (si existe) y posibilidad de rollback.
- [ ] Aprobación explícita de despliegue live y fusión a main.

## 3. Preparación local, sin despliegue

Desde Git Bash en `control-financiero-firebase`:

```bash
git checkout feature/control-financiero-v2
git pull --ff-only origin feature/control-financiero-v2
git status --short
git rev-parse HEAD
node -v
npm ci
npm run audit:security
npm test
npm run build
npm run test:pwa-build
npm run release:check
```

**Importante:** `release:check` es de solo lectura. Confirma que el build contiene worker versionado, que el proyecto de `.env` es `control-financiero-49b07`, que la configuración publica `dist`, y que estás en la rama V2 sin cambios locales. No imprime variables ni despliega Hosting.

Conservar el SHA mostrado por `git rev-parse HEAD` y la fecha de validación. No compartir el archivo `.env.local` ni credenciales de Firebase.

## 4. Verificar canales y preparar rollback

```bash
npx firebase-tools hosting:sites:list --project control-financiero-49b07
npx firebase-tools hosting:channel:list --project control-financiero-49b07
```

Verificar en Firebase Console → Hosting el sitio predeterminado correcto, la versión de `v2-pruebas`, el historial de versiones `live` y cualquier dominio personalizado. Si alguien desplegó una versión nueva al preview después de las pruebas, **no clonar** hasta volver a validarla.

Si el canal `live` ya tiene una versión estable, crear una copia opcional de la versión anterior:

```bash
npx firebase-tools hosting:clone \
  control-financiero-49b07:live \
  control-financiero-49b07:pre-v2 \
  --project control-financiero-49b07
```

Confirmar que `pre-v2` contiene la versión anterior en la consola. **Los canales de preview vencen** (por defecto siete días; máximo 30 días configurable), por lo que este respaldo es temporal. El historial de versiones de `live` es también un mecanismo de rollback, sujeto a la política de retención. No eliminar las versiones anteriores durante la estabilización.

Si `live` no tiene ninguna versión anterior, **no intentar clonarlo**: registrar que no existe respaldo de Hosting live. No confundir un respaldo de Hosting con uno de Firestore.

## 5. Comprobación rápida antes del cambio

- [ ] Inicio de sesión con el método habitual (correo y/o Google) en la URL HTTPS.
- [ ] El Dashboard refleja montos reales y no muestra permisos denegados.
- [ ] Movimientos: se puede seleccionar una categoría y se mantiene elegida.
- [ ] Plan: porcentajes editables en iPhone; herencia mensual y meses históricos sin cambios.
- [ ] Ahorro, créditos, historial y reportes abren correctamente.
- [ ] CSV y PDF se generan y se abren desde iPhone.
- [ ] La nueva versión de la PWA se puede aplicar o posponer sin perder un formulario.
- [ ] Dominio `web.app`/`firebaseapp.com` de `live` autorizado en Firebase Auth si se utiliza Google Sign-in.

Estas verificaciones pueden realizarse sin crear movimientos financieros ficticios.

## 6. Publicación definitiva (NO ejecutar sin autorización expresa)

La única acción que publicará la V2 validada en `live` es:

```bash
npx firebase-tools hosting:clone \
  control-financiero-49b07:v2-pruebas \
  control-financiero-49b07:live \
  --project control-financiero-49b07
```

**No sustituir por `firebase deploy`:** el comando `hosting:clone` reutiliza exactamente la versión de Hosting probada, incluidos recursos y configuración, sin reconstruir el frontend. **No modifica reglas ni datos de Firestore.**

Después, abrir el dominio de producción propio del sitio (`https://control-financiero-49b07.web.app` si se trata del sitio predeterminado), comprobar el inicio de sesión, los datos existentes y la navegación. El acceso `v2-pruebas` es un origen diferente: las sesiones y la PWA instalada desde ese dominio no se trasladan automáticamente al dominio `live`. Puede ser necesario volver a iniciar sesión y agregar de nuevo a inicio desde el sitio live.

## 7. Reversión ante problemas

Primera opción (Firebase Console): Hosting → Historial de versiones → localizar versión live anterior → menú → **Roll back**.

Segunda opción, si existe el canal temporal `pre-v2` y aún no vence:

```bash
npx firebase-tools hosting:clone \
  control-financiero-49b07:pre-v2 \
  control-financiero-49b07:live \
  --project control-financiero-49b07
```

El rollback solo cambia el frontend de Hosting. **No revierte movimientos, presupuestos, reglas de Firestore ni cuentas de Auth.** Por decisión previa, esta fase no realizó un respaldo de datos Firestore.

## 8. GitHub y cierre de versión

- Mantener PR #1 separado y sin fusionar hasta la autorización del usuario.
- Registrar en el PR el SHA candidato, la revisión de CI y el resultado de pruebas HTTPS.
- **No habilitar despliegues automáticos en main** antes de acordar cómo se publicará el frontend; el workflow actual solo ejecuta pruebas.
- Con la autorización explícita y las verificaciones anteriores completas, fusionar el PR a `main` y comprobar que el código resultante corresponde a la versión desplegada. Si hay conflictos o commits nuevos, detenerse y reevaluar.
- Conservar el canal `pre-v2` durante la estabilización si fue creado, revisar el nuevo Hosting live en iPhone y después retirar la URL temporal `v2-pruebas` y el dominio temporal de Auth si se agregó.

## 9. Documentación oficial

- https://firebase.google.com/docs/hosting/manage-hosting-resources
- https://firebase.google.com/docs/hosting/test-preview-deploy

**Estado al terminar fase 9:** release candidate preparado; canal live y rama main sin cambios hasta aprobación.
