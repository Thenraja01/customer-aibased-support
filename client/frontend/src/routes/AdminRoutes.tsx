import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Admin/AdminDashboard";
import TeamPage from "@/pages/Admin/OrgUsersPage";
import AdminUsersPage from "@/pages/Admin/AdminUsersPage";
import BranchesPage from "@/pages/Admin/BranchesPage";
import RolesPage from "@/pages/Admin/RolesPage";
import DocumentsPage from "@/pages/Admin/DocumentsManagementPage";
import VerificationsPage from "@/pages/Admin/OrgDocumentVerificationsPage";
import DocumentTypesPage from "@/pages/Admin/DocumentTypesPage";
import FAQPage from "@/pages/Admin/FAQPage";
import OrganizationSettingsPage from "@/pages/Admin/OrganizationSettingsPage";
import AIControlCenterPage from "@/pages/Admin/AIControlCenterPage";
import QueueManagementPage from "@/pages/Admin/QueueManagementPage";
import ChatPage from "@/pages/Customer/ChatPage";
import ProfilePage from "@/pages/Customer/ProfilePage";
import ChatHistoryPage from "@/pages/Admin/ChatHistoryManagementPage";
import AdminChatHistoryView from "@/pages/Admin/AdminChatHistoryView";
import NotificationsPage from "@/pages/Admin/NotificationsPage";
import SendNotificationPage from "@/pages/Admin/SendNotificationPage";
import KnowledgeGapPage from "@/pages/Admin/KnowledgeGapPage";
import PendingApprovalsPage from "@/pages/Admin/PendingApprovalsPage";
import RolePermissionsPage from "@/pages/Admin/RolePermissionsPage";
import AdminCommunicationPage from "@/pages/Admin/AdminCommunicationPage";

export const adminRoutes = (
  <Route
    path="/admin/*"
    element={<ProtectedRoute allowedRoles={["admin", "super_admin", "branch_admin"]} />}
  >
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="users" element={<AdminUsersPage />} />
    <Route path="branches" element={<BranchesPage />} />
    <Route path="team" element={<TeamPage />} />
    <Route path="roles" element={<RolesPage />} />
    <Route path="roles/:id/permissions" element={<RolePermissionsPage />} />
    <Route path="permissions" element={<RolePermissionsPage />} />
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="verifications" element={<VerificationsPage />} />
    <Route path="document-types" element={<DocumentTypesPage />} />
    <Route path="faq" element={<FAQPage />} />
    <Route path="ai" element={<AIControlCenterPage />} />
    <Route path="settings" element={<OrganizationSettingsPage />} />
    <Route path="queue" element={<QueueManagementPage />} />
    <Route path="chatbot" element={<ChatPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="chat-history" element={<ChatHistoryPage />} />
    <Route path="chat-history/:chatId" element={<AdminChatHistoryView />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="notifications/send" element={<SendNotificationPage />} />
    <Route path="knowledge-gaps" element={<KnowledgeGapPage />} />
    <Route path="pending-approvals" element={<PendingApprovalsPage />} />
    <Route path="communication" element={<AdminCommunicationPage />} />
  </Route>
);
