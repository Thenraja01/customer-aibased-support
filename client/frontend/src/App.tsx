import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

import Home from "@/pages/Marketing/Home";
import About from "@/pages/Marketing/About";
import Services from "@/pages/Marketing/Services";
import Features from "@/pages/Marketing/Feature";
import Industries from "@/pages/Marketing/Industries";
import Pricing from "@/pages/Marketing/Pricing";
import Contact from "@/pages/Marketing/Contact";
import Privacy from "@/pages/Marketing/Privacy";

import Login from "./pages/AuthPage/Login";
import Register from "./pages/AuthPage/Register";

import SuperAdminDashboard from "@/pages/Admin/SuperAdminDashboard";
import OrganizationsPage from "@/pages/Admin/OrganizationsPage";
import UsersPage from "@/pages/Admin/UsersPage";
import RolesPage from "@/pages/Admin/RolesPage";
import AuditLogsPage from "@/pages/Admin/AuditLogsPage";
import DocumentsPage from "@/pages/Admin/DocumentsPage";
import DocumentTypesPage from "@/pages/Admin/DocumentTypesPage";
import DocumentVerificationsPage from "@/pages/Admin/DocumentVerificationsPage";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import GlobalSearchPage from "@/pages/Admin/GlobalSearchPage";
import FAQManagementPage from "@/pages/Admin/FAQManagementPage";
import LogManagementPage from "@/pages/Admin/LogManagementPage";
import SubscriptionManagementPage from "@/pages/Admin/SubscriptionManagementPage";
import ContentManagementPage from "@/pages/Admin/ContentManagementPage";
import OrganizationApprovalPage from "@/pages/Admin/OrganizationApprovalPage";
import TokenUsagePage from "@/pages/Admin/TokenUsagePage";
import AIConfigurationPage from "@/pages/Admin/AIConfigurationPage";
import ConversationMonitoringPage from "@/pages/Admin/ConversationMonitoringPage";
import KnowledgeBasePage from "@/pages/Admin/KnowledgeBasePage";

import AgentDashboard from "@/pages/Agent/AgentDashboard";

import CustomerDashboard from "./pages/Customer/CustomerDashboard";
import ChatPage from "./pages/Customer/ChatPage";
import TicketsPage from "./pages/Customer/TicketsPage";
import ProfilePage from "./pages/Customer/ProfilePage";
import FAQPage from "./pages/Customer/FAQPage";
import CustomerDocumentsPage from "./pages/Customer/CustomerDocumentsPage";
import ChatHistoryPage from "./pages/Customer/ChatHistoryPage";
import NotificationsPage from "./pages/Customer/NotificationsPage";
import DashboardLayout from "./layout/DashboardLayout";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/features" element={<Features />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Dashboard */}
        <Route element={<DashboardLayout />}>
          {/* Super Admin Routes */}
          <Route
            element={<ProtectedRoute allowedRoles={["super_admin","admin"]} />}
          >
            <Route path="/admin" element={<SuperAdminDashboard />} />
            <Route path="/admin/organizations" element={<OrganizationsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/documents" element={<DocumentsPage />} />
            <Route
              path="/admin/document-types"
              element={<DocumentTypesPage />}
            />
            <Route
              path="/admin/document-verifications"
              element={<DocumentVerificationsPage />}
            />
            <Route path="/admin/ai-analytics" element={<AIAnalyticsPage />} />
            <Route path="/admin/search" element={<GlobalSearchPage />} />
            <Route path="/admin/chatbot" element={<ChatPage />} />
            <Route path="/admin/faqs" element={<FAQManagementPage />} />
            <Route path="/admin/logs" element={<LogManagementPage />} />
            <Route path="/admin/subscriptions" element={<SubscriptionManagementPage />} />
            <Route path="/admin/content" element={<ContentManagementPage />} />
            <Route path="/admin/org-approvals" element={<OrganizationApprovalPage />} />
            <Route path="/admin/token-usage" element={<TokenUsagePage />} />
            <Route path="/admin/ai-config" element={<AIConfigurationPage />} />
            <Route path="/admin/conversations" element={<ConversationMonitoringPage />} />
            <Route path="/admin/knowledge-base" element={<KnowledgeBasePage />} />
          </Route>

          {/* Agent Routes */}
          <Route
            element={<ProtectedRoute allowedRoles={["agent"]} />}
          >
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/chats" element={<ChatPage />} />
            <Route path="/agent/tickets" element={<TicketsPage />} />
          </Route>

          {/* Customer Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["user", "customer", "admin", "super_admin"]} />
            }
          >
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/documents" element={<CustomerDocumentsPage />} />
            <Route path="/chat-history" element={<ChatHistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Profile (all authenticated users) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin", "agent", "customer", "user"]} />
            }
          >
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
