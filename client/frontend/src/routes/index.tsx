import { Routes, Route } from "react-router-dom";
import Layout from "@/layout/layout";
import SuperAdminLayout from "@/layout/SuperAdminLayout";
import AdminLayout from "@/layout/AdminLayout";
import SupportLayout from "@/layout/SupportLayout";
import BranchLayout from "@/layout/BranchLayout";
import CustomerLayout from "@/layout/CustomerLayout";
import { publicRoutes } from "./PublicRoutes";
import { superAdminRoutes } from "./SuperAdminRoutes";
import { adminRoutes } from "./AdminRoutes";
import { supportRoutes } from "./SupportRoutes";
import { branchRoutes } from "./BranchRoutes";
import { customerRoutes } from "./CustomerRoutes";
import { profileRoute } from "./ProfileRoute";
import NotFound from "@/pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {publicRoutes}
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<SuperAdminLayout />}>
        {superAdminRoutes}
      </Route>

      <Route element={<AdminLayout />}>
        {adminRoutes}
      </Route>

      <Route element={<SupportLayout />}>
        {supportRoutes}
      </Route>

      <Route element={<BranchLayout />}>
        {branchRoutes}
      </Route>

      <Route element={<CustomerLayout />}>
        {customerRoutes}
        {profileRoute}
      </Route>
    </Routes>
  );
}
