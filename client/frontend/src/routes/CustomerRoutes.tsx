import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import Dashboard from "@/pages/Customer/CustomerDashboard";
import ChatPage from "@/pages/Customer/ChatPage";
import TicketsPage from "@/pages/Customer/TicketsPage";
import TicketDetailPage from "@/pages/Customer/TicketDetailPage";
import FAQPage from "@/pages/Customer/FAQPage";
import ChatHistoryPage from "@/pages/Customer/ChatHistoryPage";
import ChatHistoryView from "@/pages/Customer/ChatHistoryView";
import NotificationsPage from "@/pages/Customer/NotificationsPage";

export const customerRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/tickets" element={<TicketsPage />} />
    <Route path="/tickets/:id" element={<TicketDetailPage />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/chat-history" element={<ChatHistoryPage />} />
    <Route path="/chat-history/:id" element={<ChatHistoryView />} />
    <Route path="/notifications" element={<NotificationsPage />} />
  </Route>
);
