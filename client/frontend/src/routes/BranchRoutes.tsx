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
import BranchLiveSupportPage from "@/pages/BranchAdmin/BranchLiveSupportPage";
import NotFound from "@/pages/NotFound";

export const branchRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["branch_admin", "admin", "super_admin"]} />}>
    <Route path="/branch/dashboard" element={<BranchAdminDashboard />} />
    <Route path="/branch/live-support" element={<BranchLiveSupportPage />} />
    <Route path="/branch/ai" element={<AIWorkspacePage />} />
    <Route path="/branch/tickets" element={<BranchTicketsPage />} />
    <Route path="/branch/tickets/:id" element={<TicketDetailPage />} />
    <Route path="/branch/agents" element={<BranchAgentsPage />} />
    <Route path="/branch/customers" element={<BranchCustomersPage />} />
    <Route path="/branch/knowledge" element={<BranchKnowledgePage />} />
    <Route path="/branch/faq" element={<BranchFAQPage />} />
    <Route path="/branch/sla" element={<BranchSLAPage />} />
    <Route path="/branch/analytics" element={<BranchAnalyticsPage />} />
    <Route path="/branch/notifications" element={<BranchNotificationsPage />} />
    <Route path="/branch/settings" element={<BranchSettingsPage />} />
    <Route path="/branch/profile" element={<BranchProfilePage />} />
  </Route>
);