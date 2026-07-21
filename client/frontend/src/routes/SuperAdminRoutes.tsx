import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import SuperAdminDashboard from "@/pages/Admin/SuperAdminDashboard";
import OrganizationsPage from "@/pages/Admin/OrganizationsPage";
import UsersPage from "@/pages/Admin/UsersPage";
import RolesPage from "@/pages/Admin/RolesPage";
import AuditLogsPage from "@/pages/Admin/AuditLogsPage";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import GlobalSearchPage from "@/pages/Admin/GlobalSearchPage";
import ChatPage from "@/pages/Customer/ChatPage";

export const superAdminRoutes = [
  <Route key="super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
    <Route index path="/admin" element={<SuperAdminDashboard />} />
    <Route path="/admin/organizations" element={<OrganizationsPage />} />
    <Route path="/admin/users" element={<UsersPage />} />
    <Route path="/admin/roles" element={<RolesPage />} />
    <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
    <Route path="/admin/ai-analytics" element={<AIAnalyticsPage />} />
    <Route path="/admin/search" element={<GlobalSearchPage />} />
    <Route path="/admin/chatbot" element={<ChatPage />} />
  </Route>,
];
