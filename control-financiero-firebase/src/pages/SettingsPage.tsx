import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';

export function SettingsPage() {
  const { profile, logout } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ajustes"
        title="Cuenta y despliegue"
        description="Revisa tu perfil base, el estado PWA y algunos puntos clave para el despliegue en hosting estatico."
      />

      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Perfil</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Nombre</dt>
            <dd className="mt-1 text-base font-semibold text-ink">{profile?.name ?? 'Sin nombre'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Correo</dt>
            <dd className="mt-1 text-base font-semibold text-ink">{profile?.email ?? 'Sin correo'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Moneda</dt>
            <dd className="mt-1 text-base font-semibold text-ink">{profile?.currency ?? 'CLP'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Onboarding</dt>
            <dd className="mt-1 text-base font-semibold text-ink">
              {profile?.onboardingCompleted ? 'Completo' : 'Pendiente'}
            </dd>
          </div>
        </dl>
      </Card>

      <Button variant="danger" fullWidth size="lg" onClick={() => void logout()}>
        Cerrar sesion
      </Button>
    </div>
  );
}
