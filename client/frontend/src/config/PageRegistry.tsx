import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ActiveView } from '@/context/NavigationContext';

// Loader Component
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={32} className="animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

// Customer Pages
const CustomerDashboard = lazy(() => import('@/pages/Customer/CustomerDashboard'));
const CustomerChat = lazy(() => import('@/pages/Customer/ChatPage'));
const CustomerTickets = lazy(() => import('@/pages/Customer/TicketsPage'));
const CustomerFAQ = lazy(() => import('@/pages/Customer/FAQPage'));
const CustomerNotifications = lazy(() => import('@/pages/Customer/NotificationsPage'));
const CustomerChatHistory = lazy(() => import('@/pages/Customer/ChatHistoryPage'));
const CustomerDocuments = lazy(() => import('@/pages/Customer/CustomerDocumentsPage'));
const CustomerProfile = lazy(() => import('@/pages/Customer/ProfilePage'));

// Support Pages
const SupportDashboard = lazy(() => import('@/pages/Support/SupportDashboard'));
const SupportTickets = lazy(() => import('@/pages/Support/SupportTicketsPage'));
const SupportQueue = lazy(() => import('@/pages/Admin/QueueManagementPage'));
const SupportDocuments = lazy(() => import('@/pages/Support/SupportDocumentsPage'));
const SupportFAQ = lazy(() => import('@/pages/Support/SupportFAQPage'));
const SupportNotifications = lazy(() => import('@/pages/Admin/NotificationsPage'));
const SupportChat = lazy(() => import('@/pages/Support/SupportChatPage'));
const SupportChatHistory = lazy(() => import('@/pages/Support/SupportChatHistoryPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/Admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/Admin/AdminUsersPage'));
const AdminTeam = lazy(() => import('@/pages/Admin/OrgUsersPage'));
const AdminRoles = lazy(() => import('@/pages/Admin/RolesPage'));
const AdminBranches = lazy(() => import('@/pages/Admin/BranchesPage'));
const AdminPendingApprovals = lazy(() => import('@/pages/Admin/PendingApprovalsPage'));
const AdminFAQ = lazy(() => import('@/pages/Admin/FAQPage'));
const AdminAI = lazy(() => import('@/pages/Admin/AIControlCenterPage'));
const AdminKnowledgeGaps = lazy(() => import('@/pages/Admin/KnowledgeGapPage'));
const AdminQueue = lazy(() => import('@/pages/Admin/QueueManagementPage'));
const AdminChatHistory = lazy(() => import('@/pages/Admin/ChatHistoryManagementPage'));
const AdminNotifications = lazy(() => import('@/pages/Admin/NotificationsPage'));
const AdminDocuments = lazy(() => import('@/pages/Admin/DocumentsManagementPage'));
const AdminTopics = lazy(() => import('@/pages/Admin/TopicManagementPage'));
const AdminVerifications = lazy(() => import('@/pages/Admin/OrgDocumentVerificationsPage'));
const AdminDocumentTypes = lazy(() => import('@/pages/Admin/DocumentTypesPage'));
const AdminSettings = lazy(() => import('@/pages/Admin/OrganizationSettingsPage'));
const AdminSendNotification = lazy(() => import('@/pages/Admin/SendNotificationPage'));
const AdminChatbot = lazy(() => import('@/pages/Customer/ChatPage'));
const AdminCommunication = lazy(() => import('@/pages/Admin/AdminCommunicationPage'));

// SuperAdmin Pages
const SuperAdminDashboard = lazy(() => import('@/pages/SuperAdmin/SuperAdminDashboard'));
const SuperAdminCommandCenter = lazy(() => import('@/pages/SuperAdmin/CommandCenterPage'));
const SuperAdminOrganizations = lazy(() => import('@/pages/SuperAdmin/OrganizationsPage'));
const SuperAdminUsers = lazy(() => import('@/pages/SuperAdmin/UsersPage'));
const SuperAdminPendingOrgAdmins = lazy(() => import('@/pages/SuperAdmin/PendingOrgAdminsPage'));
const SuperAdminRoles = lazy(() => import('@/pages/SuperAdmin/RolesPage'));
const SuperAdminAnalytics = lazy(() => import('@/pages/Admin/AIAnalyticsPage'));
const SuperAdminChatHistory = lazy(() => import('@/pages/Admin/ChatHistoryManagementPage'));
const SuperAdminCommunication = lazy(() => import('@/pages/SuperAdmin/SuperAdminCommunicationPage'));
const SuperAdminSearch = lazy(() => import('@/pages/Admin/GlobalSearchPage'));
const SuperAdminNotifications = lazy(() => import('@/pages/Admin/NotificationsPage'));
const SuperAdminSendNotification = lazy(() => import('@/pages/SuperAdmin/SendNotificationPage'));
const SuperAdminAuditLogs = lazy(() => import('@/pages/SuperAdmin/AuditLogsPage'));
const SuperAdminAppSettings = lazy(() => import('@/pages/SuperAdmin/AppSettingsPage'));

// Mapping registry
export const pageRegistry: Record<ActiveView, React.LazyExoticComponent<any> | null> = {
  // Customer
  "customer-dashboard": CustomerDashboard,
  "customer-chat": CustomerChat,
  "customer-tickets": CustomerTickets,
  "customer-faq": CustomerFAQ,
  "customer-notifications": CustomerNotifications,
  "customer-chat-history": CustomerChatHistory,
  "customer-documents": CustomerDocuments,
  "customer-profile": CustomerProfile,

  // Support
  "support-dashboard": SupportDashboard,
  "support-tickets": SupportTickets,
  "support-queue": SupportQueue,
  "support-documents": SupportDocuments,
  "support-faq": SupportFAQ,
  "support-notifications": SupportNotifications,
  "support-chat": SupportChat,
  "support-chat-history": SupportChatHistory,

  // Admin
  "admin-dashboard": AdminDashboard,
  "admin-users": AdminUsers,
  "admin-team": AdminTeam,
  "admin-roles": AdminRoles,
  "admin-branches": AdminBranches,
  "admin-pending-approvals": AdminPendingApprovals,
  "admin-faq": AdminFAQ,
  "admin-ai": AdminAI,
  "admin-knowledge-gaps": AdminKnowledgeGaps,
  "admin-queue": AdminQueue,
  "admin-chat-history": AdminChatHistory,
  "admin-notifications": AdminNotifications,
  "admin-documents": AdminDocuments,
  "admin-topics": AdminTopics,
  "admin-verifications": AdminVerifications,
  "admin-document-types": AdminDocumentTypes,
  "admin-settings": AdminSettings,
  "admin-send-notification": AdminSendNotification,
  "admin-chatbot": AdminChatbot,
  "admin-communication": AdminCommunication,
  
  // Stubs for others (can be extended as needed)
  "admin-ai-analytics": null,
  "admin-ai-sessions": null,
  
  // SuperAdmin
  "superadmin-dashboard": SuperAdminDashboard,
  "superadmin-command-center": SuperAdminCommandCenter,
  "superadmin-organizations": SuperAdminOrganizations,
  "superadmin-users": SuperAdminUsers,
  "superadmin-pending-org-admins": SuperAdminPendingOrgAdmins,
  "superadmin-roles": SuperAdminRoles,
  "superadmin-ai-analytics": SuperAdminAnalytics,
  "superadmin-chat-history": SuperAdminChatHistory,
  "superadmin-communication": SuperAdminCommunication,
  "superadmin-search": SuperAdminSearch,
  "superadmin-notifications": SuperAdminNotifications,
  "superadmin-notifications-send": SuperAdminSendNotification,
  "superadmin-audit-logs": SuperAdminAuditLogs,
  "superadmin-app-settings": SuperAdminAppSettings,

  // Branch Stubs
  "branch-dashboard": null,
  "branch-documents": null,
  "branch-branches": null,
};

interface PageRegistryComponentProps {
  viewKey: ActiveView;
}

export function PageRegistryComponent({ viewKey }: PageRegistryComponentProps) {
  const Component = pageRegistry[viewKey];

  if (!Component) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground">
        <p>This page is currently under development or not mapped correctly.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}
