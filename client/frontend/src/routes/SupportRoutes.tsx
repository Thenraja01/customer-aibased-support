import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import SupportDashboard from "@/pages/Support/SupportDashboard";
import SupportChatPage from "@/pages/Support/SupportChatPage";
import SupportChatHistoryPage from "@/pages/Support/SupportChatHistoryPage";
import SupportChatHistoryView from "@/pages/Support/SupportChatHistoryView";
import SupportTicketsPage from "@/pages/Support/SupportTicketsPage";
import TicketDetailPage from "@/pages/Support/TicketDetailPage";
import SupportFAQPage from "@/pages/Support/SupportFAQPage";
import SupportDocumentsPage from "@/pages/Support/SupportDocumentsPage";
import QueueManagementPage from "@/pages/Admin/QueueManagementPage";
import NotificationsPage from "@/pages/Admin/NotificationsPage";
import ProfilePage from "@/pages/Customer/ProfilePage";
import SupportLiveHandoffPage from "@/pages/Support/SupportLiveHandoffPage";
import NotFound from "@/pages/NotFound";

export const supportRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["support", "branch_admin", "admin", "super_admin"]} />}>
    <Route path="/support/dashboard" element={<SupportDashboard />} />
    <Route path="/support/ai" element={<SupportChatPage />} />
    <Route path="/support/live-handoff" element={<SupportLiveHandoffPage />} />
    <Route path="/support/chat" element={<SupportLiveHandoffPage />} />
    <Route path="/support/chats" element={<SupportChatHistoryPage />} />
    <Route path="/support/chats/:id" element={<SupportChatHistoryView />} />
    <Route path="/support/chat-history" element={<SupportChatHistoryPage />} />
    <Route path="/support/chat-history/:id" element={<SupportChatHistoryView />} />
    <Route path="/support/chat/:id" element={<SupportChatHistoryView />} />
    <Route path="/support/tickets" element={<SupportTicketsPage />} />
    <Route path="/support/tickets/:id" element={<TicketDetailPage />} />
    <Route path="/support/queue" element={<QueueManagementPage />} />
    <Route path="/support/faq" element={<SupportFAQPage />} />
    <Route path="/support/documents" element={<SupportDocumentsPage />} />
    <Route path="/support/notifications" element={<NotificationsPage />} />
    <Route path="/support/profile" element={<ProfilePage />} />
  </Route>
);
