import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "@/config/routes.config";
import Layout from "./layout/layout";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/common/UI/Loading";

const LoadingFallback = () => (
  <div className="flex h-full items-center justify-center p-12">
    <LoadingSpinner />
  </div>
);

function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

const Home = lazy(() => import("@/pages/Marketing/Home"));
const About = lazy(() => import("@/pages/Marketing/About"));
const Services = lazy(() => import("@/pages/Marketing/Services"));
const Features = lazy(() => import("@/pages/Marketing/Feature"));
const Industries = lazy(() => import("@/pages/Marketing/Industries"));
const Pricing = lazy(() => import("@/pages/Marketing/Pricing"));
const Contact = lazy(() => import("@/pages/Marketing/Contact"));
const Privacy = lazy(() => import("@/pages/Marketing/Privacy"));
const Login = lazy(() => import("@/pages/AuthPage/Login"));
const Register = lazy(() => import("@/pages/AuthPage/Register"));
const ForgotPasswordPage = lazy(() => import("@/pages/public/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/public/ResetPasswordPage"));

const SuperAdminDashboard = lazy(() => import("@/pages/Admin/SuperAdminDashboard"));
const AdminDashboard = lazy(() => import("@/pages/Admin/AdminDashboard"));
const OrganizationsPage = lazy(() => import("@/pages/Admin/OrganizationsPage"));
const UsersPage = lazy(() => import("@/pages/Admin/UsersPage"));
const RolesPage = lazy(() => import("@/pages/Admin/RolesPage"));
const AuditLogsPage = lazy(() => import("@/pages/Admin/AuditLogsPage"));
const DocumentsPage = lazy(() => import("@/pages/Admin/DocumentsPage"));
const DocumentTypesPage = lazy(() => import("@/pages/Admin/DocumentTypesPage"));
const DocumentVerificationsPage = lazy(() => import("@/pages/Admin/DocumentVerificationsPage"));
const AIAnalyticsPage = lazy(() => import("@/pages/Admin/AIAnalyticsPage"));
const GlobalSearchPage = lazy(() => import("@/pages/Admin/GlobalSearchPage"));
const FAQManagementPage = lazy(() => import("@/pages/Admin/FAQManagementPage"));
const LogManagementPage = lazy(() => import("@/pages/Admin/LogManagementPage"));
const SubscriptionManagementPage = lazy(() => import("@/pages/Admin/SubscriptionManagementPage"));
const ContentManagementPage = lazy(() => import("@/pages/Admin/ContentManagementPage"));
const OrganizationApprovalPage = lazy(() => import("@/pages/Admin/OrganizationApprovalPage"));
const TokenUsagePage = lazy(() => import("@/pages/Admin/TokenUsagePage"));
const AIConfigurationPage = lazy(() => import("@/pages/Admin/AIConfigurationPage"));
const ConversationMonitoringPage = lazy(() => import("@/pages/Admin/ConversationMonitoringPage"));
const KnowledgeBasePage = lazy(() => import("@/pages/Admin/KnowledgeBasePage"));

const CustomerDashboard = lazy(() => import("@/pages/Customer/CustomerDashboard"));
const ChatPage = lazy(() => import("@/pages/Customer/ChatPage"));
const TicketsPage = lazy(() => import("@/pages/Customer/TicketsPage"));
const ProfilePage = lazy(() => import("@/pages/Customer/ProfilePage"));
const FAQPage = lazy(() => import("@/pages/Customer/FAQPage"));
const ChatHistoryPage = lazy(() => import("@/pages/Customer/ChatHistoryPage"));
const NotificationsPage = lazy(() => import("@/pages/Customer/NotificationsPage"));

const SupportDashboardPage = lazy(() => import("@/pages/support/DashboardPage"));
const SupportTicketsPage = lazy(() => import("@/pages/support/TicketsPage"));
const SupportTicketDetailsPage = lazy(() => import("@/pages/support/TicketDetailsPage"));
const SupportChatPage = lazy(() => import("@/pages/support/ChatPage"));
const SupportDocumentsPage = lazy(() => import("@/pages/support/DocumentsPage"));
const SupportNotificationsPage = lazy(() => import("@/pages/support/NotificationsPage"));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path={ROUTES.HOME} element={<LazyLoad><Home /></LazyLoad>} />
          <Route path={ROUTES.ABOUT} element={<LazyLoad><About /></LazyLoad>} />
          <Route path={ROUTES.SERVICES} element={<LazyLoad><Services /></LazyLoad>} />
          <Route path={ROUTES.FEATURES} element={<LazyLoad><Features /></LazyLoad>} />
          <Route path={ROUTES.INDUSTRIES} element={<LazyLoad><Industries /></LazyLoad>} />
          <Route path={ROUTES.PRICING} element={<LazyLoad><Pricing /></LazyLoad>} />
          <Route path={ROUTES.CONTACT} element={<LazyLoad><Contact /></LazyLoad>} />
          <Route path={ROUTES.PRIVACY} element={<LazyLoad><Privacy /></LazyLoad>} />
          <Route path={ROUTES.LOGIN} element={<LazyLoad><Login /></LazyLoad>} />
          <Route path={ROUTES.REGISTER} element={<LazyLoad><Register /></LazyLoad>} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<LazyLoad><ForgotPasswordPage /></LazyLoad>} />
          <Route path={ROUTES.RESET_PASSWORD} element={<LazyLoad><ResetPasswordPage /></LazyLoad>} />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Route>

        {/* Dashboard */}
        <Route element={<DashboardLayout />}>
          {/* Super Admin Routes (system-level) */}
          <Route
            element={<ProtectedRoute allowedRoles={["super_admin"]} />}
          >
            <Route path={ROUTES.SUPER_ADMIN.DASHBOARD} element={<LazyLoad><SuperAdminDashboard /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.ORGANIZATIONS} element={<LazyLoad><OrganizationsPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.USERS} element={<LazyLoad><UsersPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.USER_DETAILS} element={<LazyLoad><UsersPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.ROLES} element={<LazyLoad><RolesPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.AUDIT_LOGS} element={<LazyLoad><AuditLogsPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.SUBSCRIPTIONS} element={<LazyLoad><SubscriptionManagementPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.ORG_APPROVALS} element={<LazyLoad><OrganizationApprovalPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.TOKEN_USAGE} element={<LazyLoad><TokenUsagePage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.AI_CONFIG} element={<LazyLoad><AIConfigurationPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.CONTENT} element={<LazyLoad><ContentManagementPage /></LazyLoad>} />
            <Route path={ROUTES.SUPER_ADMIN.SEARCH} element={<LazyLoad><GlobalSearchPage /></LazyLoad>} />
          </Route>

          {/* Org Admin Routes (org-level) */}
          <Route
            element={<ProtectedRoute allowedRoles={["admin"]} />}
          >
            <Route path={ROUTES.ADMIN.DASHBOARD} element={<LazyLoad><AdminDashboard /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.USERS} element={<LazyLoad><UsersPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.USER_DETAILS} element={<LazyLoad><UsersPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.DOCUMENTS} element={<LazyLoad><DocumentsPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.DOCUMENT_TYPES} element={<LazyLoad><DocumentTypesPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.VERIFICATIONS} element={<LazyLoad><DocumentVerificationsPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.CHATBOT} element={<LazyLoad><ChatPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.ANALYTICS} element={<LazyLoad><AIAnalyticsPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.LOGS} element={<LazyLoad><LogManagementPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.FAQS} element={<LazyLoad><FAQManagementPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.CONVERSATIONS} element={<LazyLoad><ConversationMonitoringPage /></LazyLoad>} />
            <Route path={ROUTES.ADMIN.KNOWLEDGE_BASE} element={<LazyLoad><KnowledgeBasePage /></LazyLoad>} />
          </Route>

          {/* Support Routes */}
          <Route
            element={<ProtectedRoute allowedRoles={["support", "admin", "super_admin"]} />}
          >
            <Route path={ROUTES.SUPPORT.DASHBOARD} element={<LazyLoad><SupportDashboardPage /></LazyLoad>} />
            <Route path={ROUTES.SUPPORT.TICKETS} element={<LazyLoad><SupportTicketsPage /></LazyLoad>} />
            <Route path={ROUTES.SUPPORT.TICKET_DETAILS} element={<LazyLoad><SupportTicketDetailsPage /></LazyLoad>} />
            <Route path={ROUTES.SUPPORT.CHAT} element={<LazyLoad><SupportChatPage /></LazyLoad>} />
            <Route path={ROUTES.SUPPORT.DOCUMENTS} element={<LazyLoad><SupportDocumentsPage /></LazyLoad>} />
            <Route path={ROUTES.SUPPORT.NOTIFICATIONS} element={<LazyLoad><SupportNotificationsPage /></LazyLoad>} />
          </Route>

          {/* Customer Routes — only chat and tickets */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["user", "customer", "admin", "super_admin"]} />
            }
          >
            <Route path={ROUTES.CUSTOMER.DASHBOARD} element={<LazyLoad><CustomerDashboard /></LazyLoad>} />
            <Route path={ROUTES.CUSTOMER.CHAT} element={<LazyLoad><ChatPage /></LazyLoad>} />
            <Route path={ROUTES.CUSTOMER.TICKETS} element={<LazyLoad><TicketsPage /></LazyLoad>} />
          </Route>

          {/* Profile (all authenticated users) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["super_admin", "admin", "agent", "support", "customer", "user"]} />
            }
          >
            <Route path={ROUTES.CUSTOMER.PROFILE} element={<LazyLoad><ProfilePage /></LazyLoad>} />
          </Route>
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
