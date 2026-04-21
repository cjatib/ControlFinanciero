# ControlFinanciero

PWA mobile-first construida con React, Vite, TypeScript estricto, Tailwind CSS y Firebase modular SDK. El MVP permite registro, login con email/password y Google, categorias por usuario, transacciones, historico filtrable, dashboard con saldo y despliegue como sitio estatico tradicional.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Firebase Authentication
- Cloud Firestore
- PWA con `manifest.webmanifest` + `service worker`

## Estructura

```text
control-financiero-firebase/
├─ public/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ forms/
│  ├─ layout/
│  ├─ contexts/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  ├─ services/
│  ├─ types/
│  └─ utils/
├─ .env.example
├─ firestore.rules
└─ README.md
```

## Instalacion

1. Entra al proyecto:

```bash
cd control-financiero-firebase
```

2. Instala dependencias:

```bash
npm install
```

3. Copia `.env.example` a `.env` y completa las variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

4. Ejecuta el entorno local:

```bash
npm run dev
```

5. Genera el build estatico:

```bash
npm run build
```

## Configuracion Firebase

### 1. Crear proyecto Firebase

- Crea un proyecto en Firebase Console.
- Activa una Web App dentro del proyecto.
- Copia la configuracion y llénala en `.env`.

### 2. Habilitar Authentication

- Ve a `Authentication > Sign-in method`.
- Activa `Email/Password`.
- Si usarás Google login, activa tambien `Google`.

### 3. Authorized domains

- Agrega tu dominio real de despliegue en `Authentication > Settings > Authorized domains`.
- Esto es especialmente importante para login con Google y para cualquier flujo de auth servido desde tu hosting estatico.

### 4. Crear Firestore

- Ve a `Firestore Database`.
- Crea la base en modo production o test segun tu proceso.
- Publica las reglas iniciales de `firestore.rules`.

### 5. Reglas de seguridad

El proyecto ya incluye una base inicial con aislamiento por `uid`:

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow create, read, update, delete: if isOwner(userId);

      match /categories/{categoryId} {
        allow create, read, update, delete: if isOwner(userId);
      }

      match /transactions/{transactionId} {
        allow create, read, update, delete: if isOwner(userId);
      }
    }
  }
}
```

## Modelo de datos

### `users/{uid}`

- `uid: string`
- `name: string`
- `email: string`
- `currency: "CLP"`
- `onboardingCompleted: boolean`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

### `users/{uid}/categories/{categoryId}`

- `name: string`
- `type: "income" | "expense"`
- `color?: string`
- `icon?: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

### `users/{uid}/transactions/{transactionId}`

- `type: "income" | "expense"`
- `amount: number`
- `categoryId: string`
- `categoryName: string`
- `description?: string`
- `transactionDate: Timestamp`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

## Despliegue en hosting estatico tradicional

- Ejecuta `npm run build`.
- Sube el contenido de `dist/` a tu hosting.
- La app usa `HashRouter`, por lo que evita problemas de refresh en hostings sin reescritura de rutas.
- El service worker y el manifest quedan incluidos dentro del build para instalacion PWA.
- Si cambias de dominio o subdominio, recuerda agregarlo a Firebase Auth.

## Que queda listo en este MVP

- Registro con nombre, email y contraseña.
- Login con email/password.
- Login con Google.
- Logout.
- Persistencia de sesion mediante Firebase Auth.
- Creacion automatica de `users/{uid}` al registrar o entrar con Google por primera vez.
- CRUD de categorias.
- CRUD de transacciones.
- Dashboard con balance, ingresos, gastos y movimientos recientes.
- Historico con filtros por tipo, categoria, fechas y busqueda.
- PWA instalable con manifest y service worker.
- Build estatico listo para `dist/`.

## Fase 2 sugerida

- Firebase Functions para validacion centralizada y logica sensible.
- Reglas de Firestore mas estrictas con validacion de esquema y ownership mas profundo.
- Agregados precalculados para balances y reportes grandes.
- Recuperacion de contraseña.
- Verificacion de email.
- Soft delete y auditoria de cambios.

## Nota importante

No se depende de backend Node.js, Prisma, MySQL ni Firebase Hosting. El proyecto esta pensado para funcionar como frontend estatico puro apoyado en Firebase Authentication y Firestore.

