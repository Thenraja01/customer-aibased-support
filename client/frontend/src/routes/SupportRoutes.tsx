import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import SupportDashboard from "@/pages/Support/SupportDashboard";
import SupportChatPage from "@/pages/Support/SupportChatPage";
import SupportChatHistoryPage from "@/pages/Support/SupportChatHistoryPage";
import SupportChatHistoryView from "@/pages/Support/SupportChatHistoryView";
import SupportTicketsPage from "@/pages/Support/SupportTicketsPage";
import TicketDetailPage from "@/pages/Support/TicketDetailPage";
import SupportFAQPage from "@/pages/Support/SupportFAQPage";
import SupportDocumentsPage from "@/pages/Support/SupportDocumentsPage";
import QueueManagementPage from "@/pages/Admin/QueueManagementPage";

export const supportRoutes = (
  <Route path="/support/*" element={<ProtectedRoute allowedRoles={["support"]} />}>
    <Route path="dashboard" element={<SupportDashboard />} />
    <Route path="chat" element={<SupportChatPage />} />
    <Route path="chat-history" element={<SupportChatHistoryPage />} />
    <Route path="chat/:id" element={<SupportChatHistoryView />} />
    <Route path="tickets" element={<SupportTicketsPage />} />
    <Route path="tickets/:id" element={<TicketDetailPage />} />
    <Route path="queue" element={<QueueManagementPage />} />
    <Route path="faq" element={<SupportFAQPage />} />
    <Route path="documents" element={<SupportDocumentsPage />} />
  </Route>
);
