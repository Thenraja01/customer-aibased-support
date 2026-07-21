import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import CustomerDashboard from "@/pages/Customer/CustomerDashboard";
import ChatPage from "@/pages/Customer/ChatPage";
import TicketsPage from "@/pages/Customer/TicketsPage";
import FAQPage from "@/pages/Customer/FAQPage";
import ChatHistoryPage from "@/pages/Customer/ChatHistoryPage";
import NotificationsPage from "@/pages/Customer/NotificationsPage";

export const customerRoutes = [
  <Route key="customer" element={<ProtectedRoute allowedRoles={["user", "customer", "admin", "super_admin"]} />}>
    <Route path="/dashboard" element={<CustomerDashboard />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/tickets" element={<TicketsPage />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/chat-history" element={<ChatHistoryPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
  </Route>,
];
