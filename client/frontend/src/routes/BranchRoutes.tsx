import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import BranchAdminDashboard from "@/pages/BranchAdmin/BranchAdminDashboard";
import BranchTicketsPage from "@/pages/BranchAdmin/BranchTicketsPage";
import BranchAgentsPage from "@/pages/BranchAdmin/BranchAgentsPage";
import BranchCustomersPage from "@/pages/BranchAdmin/BranchCustomersPage";
import BranchKnowledgePage from "@/pages/BranchAdmin/BranchKnowledgePage";
import BranchFAQPage from "@/pages/BranchAdmin/BranchFAQPage";
import BranchSLAPage from "@/pages/BranchAdmin/BranchSLAPage";
import BranchAnalyticsPage from "@/pages/BranchAdmin/BranchAnalyticsPage";
import BranchNotificationsPage from "@/pages/BranchAdmin/BranchNotificationsPage";
import BranchSettingsPage from "@/pages/BranchAdmin/BranchSettingsPage";
import BranchProfilePage from "@/pages/BranchAdmin/BranchProfilePage";
import AIWorkspacePage from "@/pages/ai/AIWorkspacePage";
import TicketDetailPage from "@/pages/Support/TicketDetailPage";
import AdminCommunicationPage from "@/pages/Admin/AdminCommunicationPage";

import BranchLiveSupportPage from "@/pages/BranchAdmin/BranchLiveSupportPage";

export const branchRoutes = (
  <Route path="/branch/*" element={<ProtectedRoute allowedRoles={["branch_admin", "admin", "super_admin"]} />}>
    <Route path="dashboard" element={<BranchAdminDashboard />} />
    <Route path="live-support" element={<BranchLiveSupportPage />} />
    <Route path="ai" element={<AIWorkspacePage />} />
    <Route path="tickets" element={<BranchTicketsPage />} />
    <Route path="tickets/:id" element={<TicketDetailPage />} />
    <Route path="communication" element={<AdminCommunicationPage />} />
    <Route path="agents" element={<BranchAgentsPage />} />
    <Route path="customers" element={<BranchCustomersPage />} />
    <Route path="knowledge" element={<BranchKnowledgePage />} />
    <Route path="faq" element={<BranchFAQPage />} />
    <Route path="sla" element={<BranchSLAPage />} />
    <Route path="analytics" element={<BranchAnalyticsPage />} />
    <Route path="notifications" element={<BranchNotificationsPage />} />
    <Route path="settings" element={<BranchSettingsPage />} />
    <Route path="profile" element={<BranchProfilePage />} />
  </Route>
);