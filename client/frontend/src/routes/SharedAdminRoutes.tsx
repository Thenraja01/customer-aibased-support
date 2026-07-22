import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import AIAnalyticsPage from "@/pages/Admin/AIAnalyticsPage";
import GlobalSearchPage from "@/pages/Admin/GlobalSearchPage";
import DocumentTypesPage from "@/pages/Admin/DocumentTypesPage";
import ChatPage from "@/pages/Customer/ChatPage";

export const sharedAdminRoutes = [
  <Route key="shared-admin" element={<ProtectedRoute allowedRoles={["super_admin", "admin"]} />}>
    <Route path="/admin/document-types" element={<DocumentTypesPage />} />
    <Route path="/admin/ai-analytics" element={<AIAnalyticsPage />} />
    <Route path="/admin/search" element={<GlobalSearchPage />} />
    <Route path="/admin/chatbot" element={<ChatPage />} />
  </Route>,
];
