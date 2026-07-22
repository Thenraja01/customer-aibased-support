import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import SupportDashboard from "@/pages/Support/SupportDashboard";
import SupportChatPage from "@/pages/Support/SupportChatPage";
import TicketsPage from "@/pages/Customer/TicketsPage";
import ChatPage from "@/pages/Customer/ChatPage";

export const supportRoutes = [
  <Route key="support" element={<ProtectedRoute allowedRoles={["support"]} />}>
    <Route path="/support/dashboard" element={<SupportDashboard />} />
    <Route path="/support/support-chats" element={<SupportChatPage />} />
    <Route path="/support/chats" element={<ChatPage />} />
    <Route path="/support/tickets" element={<TicketsPage />} />
  </Route>,
];
