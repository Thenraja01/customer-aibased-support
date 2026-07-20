import { useAuthContext } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

interface Props {
  allowedRoles: string[];
  redirectTo?: string;
}

const normalizeRole = (roleName: unknown) => {
  const role = String(roleName || "").toLowerCase();
  if (role === "agent") return "support";
  if (role === "user" || role === "member") return "customer";
  return role;
};

export default function ProtectedRoute({ allowedRoles, redirectTo }: Props) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleName = normalizeRole(
    typeof user.role_id === "object"
      ? user.role_id?.role_name
      : typeof user.role_id === "string"
      ? user.role_id
      : user.roleName
  );

  const allowed = allowedRoles.map(normalizeRole);
  const isAllowed = allowed.includes(roleName) || (allowed.includes("admin") && roleName === "super_admin");

  if (!isAllowed) {
    const fallback =
      redirectTo ||
      (roleName === "super_admin"
        ? "/admin"
        : roleName === "admin"
        ? "/org-admin"
        : roleName === "support"
        ? "/support/dashboard"
        : "/dashboard");
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
