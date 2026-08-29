import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/SuperAdmin/SuperAdminDashboard";
import CommandCenterPage from "@/pages/SuperAdmin/CommandCenterPage";
import OrganizationsPage from "@/pages/SuperAdmin/OrganizationsPage";
import OrganizationDetailsPage from "@/pages/SuperAdmin/OrganizationDetailsPage";
import SubscriptionsPage from "@/pages/SuperAdmin/SubscriptionsPage";
import UsersPage from "@/pages/SuperAdmin/UsersPage";
import RolesPage from "@/pages/SuperAdmin/RolesPage";
import AuditLogsPage from "@/pages/SuperAdmin/AuditLogsPage";
import SendNotificationPage from "@/pages/SuperAdmin/SendNotificationPage";
import NotificationsPage from "@/pages/Admin/NotificationsPage";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import ProfilePage from "@/pages/Customer/ProfilePage";
import PendingOrgAdminsPage from "@/pages/SuperAdmin/PendingOrgAdminsPage";
import NotFound from "@/pages/NotFound";

export const superAdminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
    <Route path="/superadmin/command-center" element={<CommandCenterPage />} />
    <Route path="/superadmin/dashboard" element={<Dashboard />} />
    <Route path="/superadmin/organizations" element={<OrganizationsPage />} />
    <Route path="/superadmin/organizations/:id" element={<OrganizationDetailsPage />} />
    <Route path="/superadmin/subscriptions" element={<SubscriptionsPage />} />
    <Route path="/superadmin/users" element={<UsersPage />} />
    <Route path="/superadmin/roles" element={<RolesPage />} />
    <Route path="/superadmin/audit-logs" element={<AuditLogsPage />} />
    <Route path="/superadmin/notifications/send" element={<SendNotificationPage />} />
    <Route path="/superadmin/notifications" element={<NotificationsPage />} />
    <Route path="/superadmin/ai-analytics" element={<AIAnalyticsPage />} />
    <Route path="/superadmin/profile" element={<ProfilePage />} />
    <Route path="/superadmin/pending-org-admins" element={<PendingOrgAdminsPage />} />
  </Route>
);
