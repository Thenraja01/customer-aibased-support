import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Customer/CustomerDashboard";
import ChatPage from "@/pages/Customer/ChatPage";
import TicketsPage from "@/pages/Customer/TicketsPage";
import TicketDetailPage from "@/pages/Customer/TicketDetailPage";
import FAQPage from "@/pages/Customer/FAQPage";
import ChatHistoryPage from "@/pages/Customer/ChatHistoryPage";
import ChatHistoryView from "@/pages/Customer/ChatHistoryView";
import NotificationsPage from "@/pages/Customer/NotificationsPage";
import CustomerDocumentsPage from "@/pages/Customer/CustomerDocumentsPage";
import ProfilePage from "@/pages/Customer/ProfilePage";
import AIWorkspacePage from "@/pages/ai/AIWorkspacePage";

export const customerRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/customer/dashboard" element={<Dashboard />} />
    <Route path="/ai" element={<AIWorkspacePage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/customer/chat" element={<ChatPage />} />
    <Route path="/tickets" element={<TicketsPage />} />
    <Route path="/customer/tickets" element={<TicketsPage />} />
    <Route path="/tickets/:id" element={<TicketDetailPage />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/customer/faq" element={<FAQPage />} />
    <Route path="/chat-history" element={<ChatHistoryPage />} />
    <Route path="/chat-history/:id" element={<ChatHistoryView />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/customer/notifications" element={<NotificationsPage />} />
    <Route path="/documents" element={<CustomerDocumentsPage />} />
    <Route path="/customer/documents" element={<CustomerDocumentsPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/customer/profile" element={<ProfilePage />} />
  </Route>
);
