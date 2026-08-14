import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { cn } from "@/lib/utils";
import { useNavigationContext, SlideTransition, ActiveView } from "@/context/NavigationContext";
import { PageRegistryComponent } from "@/config/PageRegistry";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

interface AppShellProps {
  className?: string;
}

export default function AppShell({ className }: AppShellProps) {
  const { sidebarOverride } = useNavigationContext();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className={cn("flex min-h-screen bg-background text-foreground", className)}>
      <Sidebar />
      <main className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
        <AppHeader />
        <div className="flex-1 p-4 md:p-6 lg:p-8 relative">
          <SlideTransition viewKey={sidebarOverride || location.pathname}>
            {sidebarOverride ? <PageRegistryComponent viewKey={sidebarOverride as ActiveView} /> : <Outlet />}
          </SlideTransition>
        </div>
      </main>
    </div>
  );
}
