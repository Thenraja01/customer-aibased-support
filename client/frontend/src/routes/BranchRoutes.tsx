import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import BranchesPage from "@/pages/Admin/BranchesPage";
import DocumentsManagementPage from "@/pages/Admin/DocumentsManagementPage";
import ProfilePage from "@/pages/Customer/ProfilePage";
import BusinessAICopilotPage from "@/pages/Admin/BusinessAICopilotPage";

export const branchRoutes = (
  <Route path="/branch/*" element={<ProtectedRoute allowedRoles={["branch_admin"]} />}>
    <Route path="dashboard" element={<DocumentsManagementPage />} />
    <Route path="documents" element={<DocumentsManagementPage />} />
    <Route path="branches" element={<BranchesPage />} />
    <Route path="copilot" element={<BusinessAICopilotPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
);
