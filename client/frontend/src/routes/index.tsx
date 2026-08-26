import { Routes, Route } from "react-router-dom";
import Layout from "@/layout/layout";
import AppShell from "@/layout/AppShell";
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

      <Route element={<AppShell />}>
        {superAdminRoutes}
        {adminRoutes}
        {supportRoutes}
        {branchRoutes}
        {customerRoutes}
        {profileRoute}
      </Route>
    </Routes>
  );
}
