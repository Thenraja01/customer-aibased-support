import { useAuthContext } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { resolvePortal, homePathFor, type Portal } from "@/lib/access";
import { hasAnyRole } from "@/lib/roles";

interface ProtectedRouteProps {
  portal?: Portal;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
  redirectTo?: string;
  children?: ReactNode;
}

export default function ProtectedRoute({
  portal,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions,
  redirectTo,
  children,
}: ProtectedRouteProps) {
  const { user, loading, canAll, canAny } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (portal && resolvePortal(user) !== portal) {
    return <Navigate to={redirectTo || homePathFor(user)} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(user, allowedRoles)) {
    return <Navigate to={redirectTo || homePathFor(user)} replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPerms = requireAllPermissions
      ? canAll(requiredPermissions)
      : canAny(requiredPermissions);
    if (!hasPerms) {
      return <Navigate to={redirectTo || homePathFor(user)} replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}