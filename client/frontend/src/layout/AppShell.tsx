import { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { useNavigationContext, SlideTransition, ActiveView } from "@/context/NavigationContext";
import { PageRegistryComponent } from "@/config/PageRegistry";
import { useAuthContext } from "@/context/AuthContext";
import { getRoleName, normalizeRoleName } from "@/lib/roles";
import { resolvePortal } from "@/lib/access";
import { HeaderToolbar } from "@/components/HeaderToolbar";
import TenantAppLoader from "@/components/branding/TenantAppLoader";

interface AppShellProps {
  className?: string;
}

export default function AppShell({ className }: AppShellProps) {
  const { user, loading, isAuthenticated, orgSettings, tenant } = useAuthContext();
  const { sidebarOverride } = useNavigationContext();
  const location = useLocation();

  const roleName = normalizeRoleName(getRoleName(user));
  const portal = resolvePortal(user);

  const effectiveOrg = orgSettings || tenant || user?.organization || {};
  const loaderConfig = effectiveOrg?.loader_config || {};

  // Show the 3D entrance splash loader ONLY once after a fresh login (not on page reload/refresh)
  const [showLoginSplash, setShowLoginSplash] = useState<boolean>(() => {
    return sessionStorage.getItem("just_logged_in") === "true";
  });

  // Track sidebar navigation page loader transition
  const [isNavigating, setIsNavigating] = useState(false);

  // Trigger page transition loader whenever route or view changes
  useEffect(() => {
    setIsNavigating(true);
    const t = setTimeout(() => {
      setIsNavigating(false);
    }, 380);

    window.scrollTo({ top: 0 });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    return () => clearTimeout(t);
  }, [location.pathname, sidebarOverride]);

  const brandColor = effectiveOrg?.brand_colors?.primary || "#2563eb";
  const secondaryColor = effectiveOrg?.brand_colors?.secondary || "#7c3aed";
  const orgTitle = loaderConfig.title || effectiveOrg.name || user?.organizationName || "SupportAI";

  // Full-bleed mode for interactive consoles (Chat)
  const isFullBleed =
    location.pathname.includes("/chat") ||
    sidebarOverride?.includes("chat");

  // On page reload while verifying auth: minimal non-intrusive loading bar
  if (loading && !showLoginSplash) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "80%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${brandColor}, ${secondaryColor})`,
            zIndex: 99999,
          }}
        />
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Post-login animated 3D entrance splash loader (only runs once after signing in)
  if (showLoginSplash && loaderConfig.enabled !== false) {
    return (
      <TenantAppLoader
        title={orgTitle}
        orgName={effectiveOrg.name || user?.organizationName}
        subtitle={loaderConfig.subtitle || "Build fast, ship faster"}
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        bgTheme={loaderConfig.bg_theme || "auto"}
        duration={loaderConfig.duration_ms || 2200}
        skeletonMode={true}
        onComplete={() => {
          setShowLoginSplash(false);
          sessionStorage.removeItem("just_logged_in");
        }}
      />
    );
  }

  return (
    <div
      data-role={roleName}
      data-portal={portal || "default"}
      className={cn("flex min-h-screen bg-background text-foreground relative", className)}
    >
      {/* ── Top Page Transition Progress Bar (On Sidebar Navigation) ── */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="page-progress-bar"
            initial={{ width: "0%", opacity: 1 }}
            animate={{ width: "100%", opacity: [1, 1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: `linear-gradient(90deg, ${brandColor}, ${secondaryColor}, #38bdf8)`,
              zIndex: 99999,
              boxShadow: `0 0 14px ${brandColor}`,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* RBAC-Aware Sidebar */}
      <Sidebar />

      <HeaderToolbar />

      {/* Main Workspace Layout */}
      <main className="flex-1 min-h-screen mt-6 flex flex-col overflow-x-hidden relative">
        <div
          className={cn(
            "flex-1 relative transition-all",
            isFullBleed ? "p-6 h-screen overflow-hidden flex flex-col" : "p-4 md:p-6 lg:p-8 pt-16 md:pt-16"
          )}
        >
          <SlideTransition viewKey={sidebarOverride || location.pathname}>
            {sidebarOverride ? (
              <PageRegistryComponent viewKey={sidebarOverride as ActiveView} />
            ) : (
              <Outlet />
            )}
          </SlideTransition>
        </div>
      </main>
    </div>
  );
}
