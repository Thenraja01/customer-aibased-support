import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import SuperAdminDashboard from "@/pages/SuperAdmin/SuperAdminDashboard";
import OrganizationsPage from "@/pages/SuperAdmin/OrganizationsPage";
import UsersPage from "@/pages/SuperAdmin/UsersPage";
import RolesPage from "@/pages/SuperAdmin/RolesPage";
import AuditLogsPage from "@/pages/SuperAdmin/AuditLogsPage";

export const superAdminRoutes = [
  <Route key="super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
    <Route path="/admin" element={<SuperAdminDashboard />} />
    <Route path="/admin/organizations" element={<OrganizationsPage />} />
    <Route path="/admin/users" element={<UsersPage />} />
    <Route path="/admin/roles" element={<RolesPage />} />
    <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
  </Route>,
];
