import { useAuthContext } from "@/context/AuthContext";
import { getRoleName } from "@/lib/roles";

export function usePermissions() {
  const { user } = useAuthContext();
  const role = getRoleName(user);

  return {
    isSuperAdmin: role === "super_admin",
    isOrgAdmin: role === "admin",
    isBranchAdmin: role === "branch_admin",
    isSupport: role === "support",
    isCustomer: role === "customer",
  };
}
