# ControlFinanciero V2 — Fase 8: revisión de seguridad y estabilización

Fecha de revisión: 09/11/2026. Rama: `feature/control-financiero-v2`. No se modifica `main` ni se ejecuta despliegue PRD desde este cambio.

## 1. Resultado de auditoría

| Dependencia | Antes | Después | Acción |
| --- | --- | --- | --- |
| Firebase | 13.2.0 | 13.2.0 | Se conserva el SDK ya validado |
| Vite | 5.4.21 | 6.4.5 | Actualización a rama con correcciones de seguridad de 2026 |
| esbuild (transitiva de Vite) | 0.21.5 | 0.25.12 | Cierra aviso de CORS de servidor de desarrollo |
| @grpc/grpc-js (transitiva de Firestore) | 1.9.16 | 1.14.7 | `overrides` obligatorio para superar la restricción `~1.9.0` de Firestore |

El lockfile fue regenerado con `npm install --package-lock-only`, seguido de `npm ci`. El árbol instalado y el lockfile confirman que **no queda una copia anidada de gRPC 1.9.16**. No se utilizó `npm audit fix --force`.

En GitHub Actions se ejecutaron `npm audit --omit=dev` y luego `npm audit --audit-level=moderate` (todas las dependencias): **0 vulnerabilidades reportadas al 09/11/2026**, más 27 pruebas existentes y compilación de producción. Desde esta fase, CI bloqueará nuevas vulnerabilidades moderadas o superiores según la base de datos de npm en el momento de la ejecución.

Referencias: avisos de grpc-node https://github.com/grpc/grpc-node/security/advisories ; avisos Vite https://github.com/vitejs/vite/security/advisories ; aviso esbuild https://github.com/advisories/GHSA-67mh-4wv8-2f99 .

## 2. Defensa contra regresiones

- `tests/security-dependencies.test.mjs` comprueba el override de gRPC, versiones resueltas, Vite/esbuild y conservación de Firebase.
- `.github/workflows/v2-build.yml` ejecuta `npm ci`, `npm audit --audit-level=moderate`, todas las pruebas, `npm run build`, validación del service worker y compilación de reglas Firestore en el emulador.
- Se eliminó el workflow temporal que regeneró `package-lock.json`: no quedan tareas que actualicen dependencias automáticamente ni hagan commits por su cuenta.

## 3. Límites y riesgos pendientes

- `npm audit` comprueba vulnerabilidades conocidas, no garantiza ausencia de defectos, filtraciones o problemas de configuración.
- El servidor de desarrollo Vite debe ejecutarse solo en redes de confianza. Evitar publicar `npm run dev -- --host 0.0.0.0` a internet; la PWA instalada debe usar Firebase Hosting HTTPS.
- La aplicación usa Firebase Auth y reglas de Firestore del proyecto PRD; las pruebas actuales compilan reglas, pero **no sustituyen una batería de autorización con identidades diferentes**.
- No se introducen migraciones, cambios de esquema ni escrituras nuevas a Firestore. Por decisión previa, la base de datos PRD no dispone de un respaldo externo realizado en esta fase.
- El rollback de Hosting restaura el frontend y sus cabeceras, **no revierte movimientos ni datos de Firestore**. Las reglas de Firestore no se revierten con Hosting.
- Probar autenticación, movimientos, categorías, planes, ahorros, créditos, reportes, CSV/PDF y ciclo de actualización PWA en el canal HTTPS tras esta actualización.

## 4. Comprobación local antes de redeplegar el preview

Desde `control-financiero-firebase`:

```bash
git pull --ff-only origin feature/control-financiero-v2
node -v
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:pwa-build
npx firebase-tools hosting:channel:deploy v2-pruebas --project control-financiero-49b07 --expires 7d
```

Confirmar Node >=24.12.0 y **no** compartir `.env.local`. La publicación con `hosting:channel:deploy` actualiza el canal temporal, no `live`.

## 5. Condiciones para autorizar producción

1. CI completamente exitoso sobre el último commit de la rama V2.
2. Auditoría npm completa sin vulnerabilidades moderadas o superiores.
3. Pruebas manuales de todas las pantallas y actualizaciones en Safari iPhone HTTPS, especialmente después del cambio a Vite 6.
4. Verificación del sitio live actual, y preparación de una versión anterior para volver atrás si hace falta.
5. Autorización explícita antes de `firebase hosting:clone ... :live` o de fusionar el PR.

Las instrucciones de clonación del preview a `live` y de rollback de Hosting figuran en `V2_RELEASE.md`.
