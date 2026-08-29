import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { usePermissions } from "./usePermissions";
import { safeGetItem, safeSetItem, STORAGE_KEYS } from "@/utils/localStorage";

export function useBranchScope() {
  const { user } = useAuthContext();
  const userBranchId = typeof user?.branch_id === "object" ? user.branch_id?._id : user?.branch_id;
  const organizationId = typeof user?.organization_id === "object" ? user.organization_id?._id : user?.organization_id;
  const { isSuperAdmin, isOrgAdmin } = usePermissions();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    () => safeGetItem(STORAGE_KEYS.SELECTED_BRANCH) || userBranchId || null
  );

  useEffect(() => {
    // Branch admins and below are strictly locked to their branch
    if (!isSuperAdmin && !isOrgAdmin) {
      if (userBranchId && selectedBranchId !== userBranchId) {
        setSelectedBranchId(userBranchId);
        safeSetItem(STORAGE_KEYS.SELECTED_BRANCH, userBranchId);
      }
    }
  }, [userBranchId, isSuperAdmin, isOrgAdmin, selectedBranchId]);

  const changeBranch = (branchId: string | null) => {
    if (!isSuperAdmin && !isOrgAdmin) return; // Prevent unauthorized changes
    setSelectedBranchId(branchId);
    safeSetItem(STORAGE_KEYS.SELECTED_BRANCH, branchId);
  };

  return {
    organizationId,
    branchId: selectedBranchId,
    changeBranch,
    isBranchLocked: !isSuperAdmin && !isOrgAdmin,
  };
}
