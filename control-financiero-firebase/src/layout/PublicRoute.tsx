import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';

export function PublicRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader label="Preparando acceso..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

