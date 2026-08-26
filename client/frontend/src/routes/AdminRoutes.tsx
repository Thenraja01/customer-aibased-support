import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Admin/AdminDashboard";
import TeamPage from "@/pages/Admin/OrgUsersPage";
import AdminUsersPage from "@/pages/Admin/AdminUsersPage";
import BranchesPage from "@/pages/Admin/BranchesPage";
import RolesPage from "@/pages/Admin/RolesPage";
import DocumentsPage from "@/pages/Admin/DocumentsManagementPage";
import TopicManagementPage from "@/pages/Admin/TopicManagementPage";
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
import AdminCommunicationPage from "@/pages/Admin/AdminCommunicationPage";
import AuditLogsPage from "@/pages/Admin/AuditLogsPage";
import ModelHealthPage from "@/pages/Admin/ModelHealthPage";
import BranchAdminDashboard from "@/pages/Admin/BranchAdminDashboard";
import AdminTicketManagementPage from "@/pages/Admin/AdminTicketManagementPage";
import EscalatedTicketsPage from "@/pages/Admin/EscalatedTicketsPage";
import TicketTemplatesPage from "@/pages/Admin/TicketTemplatesPage";
import TicketFormCustomizationPage from "@/pages/Admin/TicketFormCustomizationPage";
import AIWorkspacePage from "@/pages/ai/AIWorkspacePage";

import AIIntelligenceCenter from "@/pages/Admin/AIIntelligenceCenter";

import SaaSOverviewPage from "@/pages/Dashboard/SaaSOverviewPage";
import KnowledgeBasePage from "@/pages/Dashboard/KnowledgeBasePage";
import ChatbotConfigPage from "@/pages/Dashboard/ChatbotConfigPage";
import ConversationsPage from "@/pages/Dashboard/ConversationsPage";
import ApiKeysPage from "@/pages/Dashboard/ApiKeysPage";
import SupportChatPage from "@/pages/Support/SupportChatPage";

import AdminLiveChatMonitoringPage from "@/pages/Admin/AdminLiveChatMonitoringPage";

export const adminRoutes = (
  <Route
    path="/admin/*"
    element={<ProtectedRoute allowedRoles={["admin", "super_admin", "branch_admin"]} />}
  >
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="live-chat" element={<AdminLiveChatMonitoringPage />} />
    <Route path="embedded-overview" element={<SaaSOverviewPage />} />
    <Route path="embedded-knowledge" element={<KnowledgeBasePage />} />
    <Route path="embedded-chatbot" element={<ChatbotConfigPage />} />
    <Route path="api-keys" element={<ApiKeysPage />} />
    <Route path="conversations" element={<ConversationsPage />} />

    <Route path="workspace" element={<SupportChatPage />} />
    <Route path="dashboard-branch" element={<BranchAdminDashboard />} />
    <Route path="users" element={<AdminUsersPage />} />
    <Route path="branches" element={<BranchesPage />} />
    <Route path="team" element={<TeamPage />} />
    <Route path="roles" element={<RolesPage />} />
    <Route path="tickets" element={<AdminTicketManagementPage />} />
    <Route path="tickets/escalated" element={<EscalatedTicketsPage />} />
    <Route path="tickets/templates" element={<TicketTemplatesPage />} />
    <Route path="tickets/form-customization" element={<TicketFormCustomizationPage />} />
    <Route path="documents" element={<DocumentsPage />} />
    <Route path="topics" element={<TopicManagementPage />} />
    <Route path="verifications" element={<VerificationsPage />} />
    <Route path="document-types" element={<DocumentTypesPage />} />
    <Route path="faq" element={<FAQPage />} />
    <Route path="settings" element={<OrganizationSettingsPage />} />
    <Route path="queue" element={<QueueManagementPage />} />
    <Route path="chatbot" element={<ChatPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="chat-history" element={<ChatHistoryPage />} />
    <Route path="chat-history/:chatId" element={<AdminChatHistoryView />} />
    <Route path="chats/:chatId" element={<AdminChatHistoryView />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="notifications/send" element={<SendNotificationPage />} />
    <Route path="knowledge-gaps" element={<KnowledgeGapPage />} />
    <Route path="pending-approvals" element={<PendingApprovalsPage />} />
    <Route path="communication" element={<AdminCommunicationPage />} />
    <Route path="audit-logs" element={<AuditLogsPage />} />
    <Route path="model-health" element={<ModelHealthPage />} />
    <Route path="ai" element={<AIControlCenterPage />} />
    <Route path="ai/prompt" element={<AIControlCenterPage />} />
    <Route path="ai/settings" element={<AIControlCenterPage />} />
    <Route path="ai/guardrails" element={<AIControlCenterPage />} />
    <Route path="ai/playground" element={<AIControlCenterPage />} />
    <Route path="ai/*" element={<AIControlCenterPage />} />
    <Route path="ai-control" element={<AIControlCenterPage />} />
    <Route path="ai-intelligence" element={<AIIntelligenceCenter />} />
  </Route>
);