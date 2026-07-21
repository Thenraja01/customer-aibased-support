import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import OrgUsersPage from "@/pages/Admin/OrgUsersPage";
import DocumentsManagementPage from "@/pages/Admin/DocumentsManagementPage";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import GlobalSearchPage from "@/pages/Admin/GlobalSearchPage";
import ChatPage from "@/pages/Customer/ChatPage";

export const adminRoutes = [
  <Route key="admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/team" element={<OrgUsersPage />} />
    <Route path="/admin/documents" element={<DocumentsManagementPage />} />
    <Route path="/admin/ai-analytics" element={<AIAnalyticsPage />} />
    <Route path="/admin/search" element={<GlobalSearchPage />} />
    <Route path="/admin/chatbot" element={<ChatPage />} />
  </Route>,
];
