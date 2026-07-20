import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  const isAuthenticated = !!user;
  const roleName = user?.role_id?.role_name || user?.role?.name || '';
  const hasRole = allowedRoles ? allowedRoles.includes(roleName) : true;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole) {
    if (roleName === 'admin' || roleName === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    if (roleName === 'agent') {
      return <Navigate to="/agent/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
