const AUTH_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Ese correo ya esta registrado.',
  'auth/invalid-email': 'El correo ingresado no es valido.',
  'auth/invalid-credential': 'Las credenciales no son correctas.',
  'auth/operation-not-allowed': 'El proveedor de acceso no esta habilitado en Firebase.',
  'auth/popup-closed-by-user': 'El popup de Google se cerro antes de completar el ingreso.',
  'auth/too-many-requests': 'Se bloquearon temporalmente los intentos. Espera un momento.',
  'auth/unauthorized-domain': 'Agrega este dominio en Authorized domains dentro de Firebase Auth.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña es demasiado debil.',
  'auth/wrong-password': 'La contraseña ingresada no coincide.',
};

export function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return AUTH_MESSAGES[error.code] ?? 'Ocurrio un error inesperado. Intenta nuevamente.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ocurrio un error inesperado. Intenta nuevamente.';
}

