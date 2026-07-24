import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import Dashboard from "@/pages/SuperAdmin/SuperAdminDashboard";
import CommandCenterPage from "@/pages/SuperAdmin/CommandCenterPage";
import OrganizationsPage from "@/pages/SuperAdmin/OrganizationsPage";
import OrganizationDetailsPage from "@/pages/SuperAdmin/OrganizationDetailsPage";
import UsersPage from "@/pages/SuperAdmin/UsersPage";
import RolesPage from "@/pages/SuperAdmin/RolesPage";
import AuditLogsPage from "@/pages/SuperAdmin/AuditLogsPage";
import AppSettingsPage from "@/pages/SuperAdmin/AppSettingsPage";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import GlobalSearchPage from "@/pages/Admin/GlobalSearchPage";
import ChatHistoryManagementPage from "@/pages/Admin/ChatHistoryManagementPage";
import ChatPage from "@/pages/Customer/ChatPage";
import KnowledgeGraphPage from "@/pages/SuperAdmin/KnowledgeGraphPage";

export const superAdminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
    <Route path="/superadmin/command-center" element={<CommandCenterPage />} />
    <Route path="/superadmin/dashboard" element={<Dashboard />} />
    <Route path="/superadmin/organizations" element={<OrganizationsPage />} />
    <Route path="/superadmin/organizations/:id" element={<OrganizationDetailsPage />} />
    <Route path="/superadmin/users" element={<UsersPage />} />
    <Route path="/superadmin/roles" element={<RolesPage />} />
    <Route path="/superadmin/audit-logs" element={<AuditLogsPage />} />
    <Route path="/superadmin/app-settings" element={<AppSettingsPage />} />
    <Route path="/superadmin/ai-analytics" element={<AIAnalyticsPage />} />
    <Route path="/superadmin/search" element={<GlobalSearchPage />} />
    <Route path="/superadmin/chat-history" element={<ChatHistoryManagementPage />} />
    <Route path="/superadmin/chatbot" element={<ChatPage />} />
    <Route path="/superadmin/knowledge-graph" element={<KnowledgeGraphPage />} />
  </Route>
);
