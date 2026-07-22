import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import OrgUsersPage from "@/pages/Admin/OrgUsersPage";
import DocumentsManagementPage from "@/pages/Admin/DocumentsManagementPage";
import OrgDocumentVerificationsPage from "@/pages/Admin/OrgDocumentVerificationsPage";

export const adminRoutes = [
  <Route key="admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/team" element={<OrgUsersPage />} />
    <Route path="/admin/documents" element={<DocumentsManagementPage />} />
    <Route path="/admin/verifications" element={<OrgDocumentVerificationsPage />} />
  </Route>,
];
