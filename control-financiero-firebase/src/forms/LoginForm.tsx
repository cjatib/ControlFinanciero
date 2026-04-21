import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { validateEmail, validatePassword } from '@/utils/validators';

interface LoginState {
  email: string;
  password: string;
}

export function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const [formState, setFormState] = useState<LoginState>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof LoginState, string>> = {};
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    if (emailError) {
      nextErrors.email = emailError;
    }

    if (passwordError) {
      nextErrors.password = passwordError;
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
      await login(formState);
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setSubmitError(null);
      setGoogleSubmitting(true);
      await loginWithGoogle();
    } catch (error) {
      setSubmitError(getFirebaseErrorMessage(error));
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent/80">Acceso</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Inicia sesion en tu panel</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Usa email y contraseña, o entra con Google para continuar con tu historial financiero.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Input
          id="login-email"
          label="Correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.cl"
          value={formState.email}
          error={errors.email}
          onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
        />
        <Input
          id="login-password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={formState.password}
          error={errors.password}
          onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
        />

        {submitError ? <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-rose-200">{submitError}</p> : null}

        <Button type="submit" fullWidth size="lg" disabled={submitting || googleSubmitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          disabled={submitting || googleSubmitting}
          onClick={handleGoogleLogin}
        >
          {googleSubmitting ? 'Conectando Google...' : 'Continuar con Google'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        ¿Aun no tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-accent transition hover:text-[#69e8be]">
          Crea tu usuario
        </Link>
      </p>
    </div>
  );
}
