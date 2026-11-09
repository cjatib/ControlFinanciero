# ControlFinanciero V2 — Publicación segura por HTTPS (fase 7)

## Objetivo

**Estado de fase 9:** la vista previa HTTPS ya fue probada en iPhone y Chrome; las dependencias de fase 8 están actualizadas. El procedimiento de go-live y los puntos de control definitivos están en **`V2_GO_LIVE.md`**. No se ha desplegado el canal `live`.

Probar las actualizaciones de la PWA desde HTTPS real, **sin reemplazar el canal live de Firebase Hosting** y sin fusionar el Pull Request V2.
Proyecto: **Control Financiero - PRD** (`control-financiero-49b07`), plan Spark.
La URL de preview es pública y utiliza el mismo backend de Authentication y Firestore. No compartirla ni crear/borrar registros reales para hacer pruebas.

## 1. Verificar entorno y sitio Hosting

Desde la carpeta `control-financiero-firebase`:
```bash
git branch --show-current
git status
npx firebase-tools login:list
npx firebase-tools hosting:sites:list --project control-financiero-49b07
```
Debe mostrar la rama `feature/control-financiero-v2`. Verificar que existe el sitio Hosting predeterminado; si Hosting no está habilitado, activarlo desde Firebase Console antes de continuar.
No ejecutar `firebase init hosting` sobre el archivo firebase.json actual: podría reemplazar reglas y configuración.
Comprobar localmente que `.env.local` utiliza el ID de proyecto `control-financiero-49b07`. No publicar ni compartir los valores del archivo.

## 2. Compilar y validar antes de publicar
```bash
npm ci
npm test
npm run build
npm run test:pwa-build
```
`firebase.json` especifica `hosting.public = dist`, headers sin caché persistente para SW/index/manifiesto y caché inmutable para `/assets/`. Conservar la sección independiente de Firestore.

## 3. Desplegar solo a un canal temporal HTTPS

NO usar `firebase deploy --only hosting`, pues eso publica en el canal **live**.
```bash
npx firebase-tools hosting:channel:deploy v2-pruebas \
  --project control-financiero-49b07 \
  --expires 7d
```
El comando despliega **solo Hosting en el canal temporal**, no modifica reglas ni documentos Firestore. La CLI devuelve una URL HTTPS: abrirla desde Chrome y Safari en iPhone. El enlace es público, aunque difícil de adivinar.
Si el acceso con Google arroja `auth/unauthorized-domain`, agregar el hostname EXACTO de la URL temporal en Firebase Console → Authentication → Settings → Authorized domains. No usar comodines ni cambiar `authDomain` en `.env.local`. Eliminar el hostname de la lista al terminar las pruebas.

## 4. Probar la actualización de PWA

1. Entrar a la URL temporal HTTPS en Chrome y Safari; verificar sesión, carga del dashboard y lectura de los datos reales.
2. En Safari, agregar la app desde ese dominio a la pantalla de inicio si deseas probar el modo instalado.
3. Publicar una versión realmente diferente del frontend en el MISMO canal, por ejemplo un texto inofensivo en una pantalla. Recompilar y volver a ejecutar el comando anterior.
4. Volver a abrir la PWA y entrar a **Más → Ajustes → Buscar actualizaciones**, que fuerza la comprobación de una versión nueva en ese momento. En segundo plano, la revisión automática también se limita a una vez cada 30 minutos. Verificar la aparición del aviso «Hay una nueva versión disponible».
5. Pulsar «Más tarde» y confirmar que no se recarga.
6. Si se pulsó «Más tarde», cerrar y volver a abrir la PWA para recuperar el aviso, o pulsar **Más → Ajustes → Buscar actualizaciones**. Seleccionar «Actualizar ahora» y confirmar que se recarga con la versión reciente.
7. Revisar la navegación, formularios, categorías, presupuestos, reportes y exportación CSV/PDF.
8. En Chrome DevTools → Application → Cache Storage, verificar que el service worker no guarda JSON con transacciones ni respuestas de Firestore. Pueden existir cachés locales independientes administradas por el SDK Firebase.

El service worker solo se registra en builds de producción, y exige HTTPS o localhost. `npm run dev` y la IP LAN HTTP no sirven para comprobar actualizaciones reales en iPhone.

## 5. Eliminar la vista previa al terminar
```bash
npx firebase-tools hosting:channel:delete v2-pruebas --project control-financiero-49b07
```
También vence a los siete días. Si autorizaste el hostname temporal en Firebase Authentication, retirarlo de la lista de dominios.

## 6. Seguridad de dependencias: resuelta en la fase 8

Firebase 13.2.0 se mantiene. Vite está actualizado a 6.4.5, esbuild a 0.25.12 y gRPC transitivo a 1.14.7. El archivo `package-lock.json` fue regenerado y confirmado con una instalación limpia.

El último `npm audit --audit-level=moderate` realizado en GitHub Actions no reportó vulnerabilidades conocidas, tanto de producción como de desarrollo. Las pruebas y la compilación pasaron. Consulta `V2_SECURITY.md` para las referencias y las limitaciones de esta auditoría.

**Completado:** la vista previa HTTPS posterior a la fase 8 funciona correctamente según las pruebas del usuario. Antes del paso a `live` se realizará una última comprobación del canal y del flujo de inicio de sesión. No ejecutar `npm audit fix --force` ni cambiar Firebase sin nuevas pruebas.
## 7. Condiciones antes de publicar live

La versión HTTPS ya pasó pruebas funcionales del usuario; mantener la última comprobación de sesión y navegación, confirmar el canal correcto y conservar procedimiento de reversión. **No fusionar main ni desplegar live sin autorización explícita.**

## 8. Fase 8 — Seguridad aplicada y procedimiento de reversión

Se actualizó **Vite 6.4.5**, su `esbuild` a 0.25.12 y la dependencia transitiva `@grpc/grpc-js` a 1.14.7 mediante override; Firebase se mantiene en 13.2.0. El primer `npm audit` completo de CI reportó **0 vulnerabilidades**. El CI ahora exige auditoría y pruebas. Detalle: `V2_SECURITY.md`.

### Nueva prueba en el canal HTTPS, sin modificar el sitio live

Desde la rama V2 y con Node >=24.12.0:
```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:pwa-build
npx firebase-tools hosting:channel:deploy v2-pruebas --project control-financiero-49b07 --expires 7d
```

**Tras actualizar Vite y dependencias, repetir pruebas manuales del canal HTTPS** en Chrome y iPhone: sesión Google/correo, movimientos, categorías, plan, ahorro, créditos, dashboard, reportes, CSV/PDF y aviso de nueva versión. Este canal comparte los datos PRD.

### Condición previa a una futura publicación live (solo cuando se autorice)

Verificar que la vista previa es correcta y que Hosting live tiene una versión de respaldo. Si hay una versión live previa, conservarla temporalmente en otro canal:
```bash
npx firebase-tools hosting:clone \
  control-financiero-49b07:live \
  control-financiero-49b07:pre-v2 \
  --project control-financiero-49b07
```

Revisar en Firebase Console → Hosting → historial que el clon contiene la versión estable anterior. Si el canal live no tenía versión previa, no existe tal respaldo de Hosting y no corresponde ejecutar ese clon.

**Solo con aprobación expresa**, publicar exactamente la versión ya probada en `v2-pruebas`:
```bash
npx firebase-tools hosting:clone \
  control-financiero-49b07:v2-pruebas \
  control-financiero-49b07:live \
  --project control-financiero-49b07
```

Clonar un canal de Hosting **no altera reglas Firestore ni documentos**. El sitio live usaría el frontend publicado desde la vista previa.

### Reversión de Hosting si el frontend falla

Usar Firebase Console → Hosting → Historial de versiones → menú de una versión estable anterior → **Roll back**. Como alternativa, si existe el canal `pre-v2` con la versión estable:
```bash
npx firebase-tools hosting:clone \
  control-financiero-49b07:pre-v2 \
  control-financiero-49b07:live \
  --project control-financiero-49b07
```

Este rollback afecta únicamente archivos y configuración de Hosting: **no recupera movimientos ni restaura reglas de Firestore**. No borrar el canal `pre-v2` antes de cerrar el período de estabilización. Documentación oficial: https://firebase.google.com/docs/hosting/manage-hosting-resources .
