import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader label="Restaurando tu sesion..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

