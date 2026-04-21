export function validateEmail(email: string): string | null {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return 'El correo es obligatorio.';
  }

  if (!emailPattern.test(email.trim())) {
    return 'Ingresa un correo valido.';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password.trim()) {
    return 'La contraseña es obligatoria.';
  }

  if (password.trim().length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `El campo ${fieldName} es obligatorio.`;
  }

  return null;
}

export function validateAmount(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) {
    return 'Ingresa un monto mayor a cero.';
  }

  return null;
}

