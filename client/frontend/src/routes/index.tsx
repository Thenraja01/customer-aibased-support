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
import EmbedChatWidgetPage from "@/pages/Embed/EmbedChatWidgetPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Embeddable React Chat Widget (for <iframe> embedding) */}
      <Route path="/widget" element={<EmbedChatWidgetPage />} />
      <Route path="/embed/chat" element={<EmbedChatWidgetPage />} />

      <Route element={<Layout />}>
        {publicRoutes}
      </Route>

      <Route element={<AppShell />}>
        {superAdminRoutes}
      </Route>

      <Route element={<AdminLayout />}>
        {adminRoutes}
      </Route>

      <Route element={<SupportLayout />}>
        {supportRoutes}
        {branchRoutes}
        {customerRoutes}
        {profileRoute}
      </Route>

      {/* Standalone Fullscreen 404 Page (No Sidebar, No Layout) */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
