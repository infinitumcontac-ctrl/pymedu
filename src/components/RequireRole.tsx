import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, Rol } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireRoleProps {
  roles: Rol[];
  redirectTo?: string;
}

export default function RequireRole({ roles, redirectTo = '/erp/inicio' }: RequireRoleProps) {
  const { perfil, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!perfil) {
    return <Navigate to={redirectTo} replace />;
  }

  if (perfil.rol === 'demo') {
    return <Outlet />;
  }

  if (!roles.includes(perfil.rol)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
