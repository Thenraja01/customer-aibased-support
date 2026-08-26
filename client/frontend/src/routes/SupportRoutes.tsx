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
import AdminCommunicationPage from "@/pages/Admin/AdminCommunicationPage";

import SupportLiveHandoffPage from "@/pages/Support/SupportLiveHandoffPage";

export const supportRoutes = (
  <Route path="/support/*" element={<ProtectedRoute allowedRoles={["support", "branch_admin", "admin", "super_admin"]} />}>
    <Route path="dashboard" element={<SupportDashboard />} />
    <Route path="ai" element={<SupportChatPage />} />
    <Route path="live-handoff" element={<SupportLiveHandoffPage />} />
    <Route path="chat" element={<SupportLiveHandoffPage />} />
    <Route path="chats" element={<SupportChatHistoryPage />} />
    <Route path="chats/:id" element={<SupportChatHistoryView />} />
    <Route path="chat-history" element={<SupportChatHistoryPage />} />
    <Route path="chat-history/:id" element={<SupportChatHistoryView />} />
    <Route path="chat/:id" element={<SupportChatHistoryView />} />
    <Route path="tickets" element={<SupportTicketsPage />} />
    <Route path="tickets/:id" element={<TicketDetailPage />} />
    <Route path="communication" element={<AdminCommunicationPage />} />
    <Route path="queue" element={<QueueManagementPage />} />
    <Route path="faq" element={<SupportFAQPage />} />
    <Route path="documents" element={<SupportDocumentsPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
);
