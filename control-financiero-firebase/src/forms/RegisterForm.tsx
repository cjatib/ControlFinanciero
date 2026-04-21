import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateEmail, validatePassword, validateRequired } from '@/utils/validators';

interface RegisterState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm() {
  const { register } = useAuth();
  const [formState, setFormState] = useState<RegisterState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof RegisterState, string>> = {};
    const nameError = validateRequired(formState.name, 'nombre');
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    if (nameError) {
      nextErrors.name = nameError;
    }

    if (emailError) {
      nextErrors.email = emailError;
    }

    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (formState.confirmPassword.trim() !== formState.password.trim()) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      await register({
        name: formState.name,
        email: formState.email,
        password: formState.password,
      });
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent/80">Registro</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Crea tu espacio financiero</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Tu documento `users/{'{uid}'}` se crea automaticamente al registrarte para aislar toda tu data.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Input
          id="register-name"
          label="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          value={formState.name}
          error={errors.name}
          onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
        />
        <Input
          id="register-email"
          label="Correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.cl"
          value={formState.email}
          error={errors.email}
          onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
        />
        <Input
          id="register-password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Minimo 6 caracteres"
          value={formState.password}
          error={errors.password}
          onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
        />
        <Input
          id="register-confirm-password"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          value={formState.confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => setFormState((current) => ({ ...current, confirmPassword: event.target.value }))}
        />

        {submitError ? <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-rose-200">{submitError}</p> : null}

        <Button type="submit" fullWidth size="lg" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-accent transition hover:text-[#69e8be]">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
