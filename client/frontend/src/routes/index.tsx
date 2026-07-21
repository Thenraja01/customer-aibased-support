import { Routes, Route } from "react-router-dom";
import Layout from "@/layout/layout";
import DashboardLayout from "@/layout/DashboardLayout";
import { publicRoutes } from "./PublicRoutes";
import { superAdminRoutes } from "./SuperAdminRoutes";
import { adminRoutes } from "./AdminRoutes";
import { supportRoutes } from "./SupportRoutes";
import { customerRoutes } from "./CustomerRoutes";
import { profileRoute } from "./ProfileRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {publicRoutes}
      </Route>

      <Route element={<DashboardLayout />}>
        {superAdminRoutes}
        {adminRoutes}
        {supportRoutes}
        {customerRoutes}
        {profileRoute}
      </Route>
    </Routes>
  );
}
