import { useAuthContext } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

interface Props {
  allowedRoles: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ allowedRoles, redirectTo }: Props) {
  const { user, loading } = useAuthContext();

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

  const roleName =
    typeof user.role_id === "object"
      ? user.role_id?.role_name
      : typeof user.role_id === "string"
      ? user.role_id
      : null;

  if (!roleName || !allowedRoles.includes(roleName)) {
    const fallback =
      redirectTo ||
      (roleName === "super_admin"
        ? "/admin"
        : roleName === "admin"
        ? "/admin/dashboard"
        : roleName === "support"
        ? "/support/dashboard"
        : "/dashboard");
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
