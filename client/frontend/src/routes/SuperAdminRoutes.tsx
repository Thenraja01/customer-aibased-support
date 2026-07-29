import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/SuperAdmin/SuperAdminDashboard";
import CommandCenterPage from "@/pages/SuperAdmin/CommandCenterPage";
import OrganizationsPage from "@/pages/SuperAdmin/OrganizationsPage";
import OrganizationDetailsPage from "@/pages/SuperAdmin/OrganizationDetailsPage";
import UsersPage from "@/pages/SuperAdmin/UsersPage";
import RolesPage from "@/pages/SuperAdmin/RolesPage";
import AuditLogsPage from "@/pages/SuperAdmin/AuditLogsPage";
import AppSettingsPage from "@/pages/SuperAdmin/AppSettingsPage";
import SendNotificationPage from "@/pages/SuperAdmin/SendNotificationPage";
import NotificationsPage from "@/pages/Admin/NotificationsPage";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import GlobalSearchPage from "@/pages/Admin/GlobalSearchPage";
import ChatHistoryManagementPage from "@/pages/Admin/ChatHistoryManagementPage";
import SuperAdminChatHistoryView from "@/pages/SuperAdmin/SuperAdminChatHistoryView";
import ChatPage from "@/pages/Customer/ChatPage";
import KnowledgeGraphPage from "@/pages/SuperAdmin/KnowledgeGraphPage";
import KnowledgeGapPage from "@/pages/Admin/KnowledgeGapPage";
import ProfilePage from "@/pages/Customer/ProfilePage";
import PendingOrgAdminsPage from "@/pages/SuperAdmin/PendingOrgAdminsPage";
import SuperAdminCommunicationPage from "@/pages/SuperAdmin/SuperAdminCommunicationPage";

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
    <Route path="/superadmin/notifications/send" element={<SendNotificationPage />} />
    <Route path="/superadmin/notifications" element={<NotificationsPage />} />
    <Route path="/superadmin/ai-analytics" element={<AIAnalyticsPage />} />
    <Route path="/superadmin/search" element={<GlobalSearchPage />} />
    <Route path="/superadmin/chat-history" element={<ChatHistoryManagementPage />} />
    <Route path="/superadmin/chat-history/:chatId" element={<SuperAdminChatHistoryView />} />
    <Route path="/superadmin/chatbot" element={<ChatPage />} />
    <Route path="/superadmin/knowledge-graph" element={<KnowledgeGraphPage />} />
    <Route path="/superadmin/knowledge-gaps" element={<KnowledgeGapPage />} />
    <Route path="/superadmin/profile" element={<ProfilePage />} />
    <Route path="/superadmin/pending-org-admins" element={<PendingOrgAdminsPage />} />
    <Route path="/superadmin/communication" element={<SuperAdminCommunicationPage />} />
  </Route>
);
