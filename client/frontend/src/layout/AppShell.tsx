import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { useNavigationContext, SlideTransition, ActiveView } from "@/context/NavigationContext";
import { PageRegistryComponent } from "@/config/PageRegistry";
import { useAuthContext } from "@/context/AuthContext";
import { getRoleName, normalizeRoleName } from "@/lib/roles";
import { resolvePortal } from "@/lib/access";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { HeaderToolbar } from "@/components/HeaderToolbar";

interface AppShellProps {
  className?: string;
}

export default function AppShell({ className }: AppShellProps) {
  const { user, loading, isAuthenticated } = useAuthContext();
  const { sidebarOverride } = useNavigationContext();
  const location = useLocation();

  const roleName = normalizeRoleName(getRoleName(user));
  const portal = resolvePortal(user);

  // Full-bleed mode for interactive consoles (Chat)
  const isFullBleed =
    location.pathname.includes("/chat") ||
    sidebarOverride?.includes("chat");

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [location.pathname]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-mono">Verifying Access...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div
      data-role={roleName}
      data-portal={portal || "default"}
      className={cn("flex min-h-screen bg-background text-foreground", className)}
    >
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
