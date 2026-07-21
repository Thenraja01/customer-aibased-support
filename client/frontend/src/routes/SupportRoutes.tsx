import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import AgentDashboard from "@/pages/Agent/AgentDashboard";
import ChatPage from "@/pages/Customer/ChatPage";
import TicketsPage from "@/pages/Customer/TicketsPage";

export const supportRoutes = [
  <Route key="support" element={<ProtectedRoute allowedRoles={["agent"]} />}>
    <Route path="/agent/dashboard" element={<AgentDashboard />} />
    <Route path="/agent/chats" element={<ChatPage />} />
    <Route path="/agent/tickets" element={<TicketsPage />} />
  </Route>,
];
