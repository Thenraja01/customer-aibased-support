import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";
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
import ApiKeysPage from "@/pages/Dashboard/ApiKeysPage";
import SupportChatPage from "@/pages/Support/SupportChatPage";

import AdminLiveChatMonitoringPage from "@/pages/Admin/AdminLiveChatMonitoringPage";

export const adminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["admin", "branch_admin"]} />}>
    <Route path="/admin/dashboard" element={<Dashboard />} />
    <Route path="/admin/live-chat" element={<AdminLiveChatMonitoringPage />} />
    <Route path="/admin/embedded-overview" element={<SaaSOverviewPage />} />
    <Route path="/admin/embedded-knowledge" element={<KnowledgeBasePage />} />
    <Route path="/admin/embedded-chatbot" element={<ChatbotConfigPage />} />
    <Route path="/admin/api-keys" element={<ApiKeysPage />} />

    <Route path="/admin/workspace" element={<SupportChatPage />} />
    <Route path="/admin/dashboard-branch" element={<BranchAdminDashboard />} />
    <Route path="/admin/users" element={<AdminUsersPage />} />
    <Route path="/admin/branches" element={<BranchesPage />} />
    <Route path="/admin/team" element={<TeamPage />} />
    <Route path="/admin/roles" element={<RolesPage />} />
    <Route path="/admin/tickets" element={<AdminTicketManagementPage />} />
    <Route path="/admin/tickets/escalated" element={<EscalatedTicketsPage />} />
    <Route path="/admin/tickets/templates" element={<TicketTemplatesPage />} />
    <Route path="/admin/tickets/form-customization" element={<TicketFormCustomizationPage />} />
    <Route path="/admin/documents" element={<DocumentsPage />} />
    <Route path="/admin/topics" element={<TopicManagementPage />} />
    <Route path="/admin/verifications" element={<VerificationsPage />} />
    <Route path="/admin/document-types" element={<DocumentTypesPage />} />
    <Route path="/admin/faq" element={<FAQPage />} />
    <Route path="/admin/settings" element={<OrganizationSettingsPage />} />
    <Route path="/admin/queue" element={<QueueManagementPage />} />
    <Route path="/admin/chatbot" element={<ChatPage />} />
    <Route path="/admin/profile" element={<ProfilePage />} />
    <Route path="/admin/chat-history" element={<ChatHistoryPage />} />
    <Route path="/admin/chat-history/:chatId" element={<AdminChatHistoryView />} />
    <Route path="/admin/chats/:chatId" element={<AdminChatHistoryView />} />
    <Route path="/admin/notifications" element={<NotificationsPage />} />
    <Route path="/admin/notifications/send" element={<SendNotificationPage />} />
    <Route path="/admin/knowledge-gaps" element={<KnowledgeGapPage />} />
    <Route path="/admin/pending-approvals" element={<PendingApprovalsPage />} />
    <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
    <Route path="/admin/model-health" element={<ModelHealthPage />} />
    <Route path="/admin/ai" element={<AIControlCenterPage />} />
    <Route path="/admin/ai/prompt" element={<AIControlCenterPage />} />
    <Route path="/admin/ai/settings" element={<AIControlCenterPage />} />
    <Route path="/admin/ai/guardrails" element={<AIControlCenterPage />} />
    <Route path="/admin/ai/playground" element={<AIControlCenterPage />} />
    <Route path="/admin/ai-control" element={<AIControlCenterPage />} />
    <Route path="/admin/ai-intelligence" element={<AIIntelligenceCenter />} />
  </Route>
);