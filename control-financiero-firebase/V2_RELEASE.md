# ControlFinanciero V2 — Publicación segura por HTTPS (fase 7)

## Objetivo

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

## 6. Seguridad de dependencias: revisión pendiente independiente

El lockfile conserva `@grpc/grpc-js` 1.9.16, marcado por avisos de 2026. Afectan principalmente configuraciones de servidor gRPC, no necesariamente la ejecución en el navegador, pero corresponde corregirlos.
No usar `npm audit fix --force`: propone degradar Firebase. Para una actualización controlada:
- Registrar `npm ls @grpc/grpc-js` y `npm audit --omit=dev`.
- Actualizar la dependencia transitiva a una versión corregida con `overrides` y regenerar `package-lock.json` con npm.
- Ejecutar `npm ci`, `npm test`, `npm run build` y comprobar Firebase Auth/Firestore en la PWA.
- Tratar Vite/esbuild en otra actualización, separada del despliegue HTTPS.

## 7. Condiciones antes de publicar live

Validar Safari iPhone HTTPS, persistencia de sesión, actualización sin interrumpir trabajo, navegación, reglas y dependencias. Conservar procedimiento de reversión. **No fusionar main ni desplegar live hasta completar estas validaciones.**
