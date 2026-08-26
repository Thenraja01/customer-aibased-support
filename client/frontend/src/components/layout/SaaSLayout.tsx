import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Bot, MessageSquare, Key, Settings, Menu, X, Sparkles } from "lucide-react";
import { HeaderToolbar } from "@/components/HeaderToolbar";

export default function SaaSLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Overview", path: "/dashboard/overview", icon: LayoutDashboard },
    { label: "Knowledge Base", path: "/dashboard/knowledge", icon: Database },
    { label: "Chatbot", path: "/dashboard/chatbot", icon: Bot },
    { label: "Conversations", path: "/dashboard/conversations", icon: MessageSquare },
    { label: "API Keys", path: "/dashboard/api-keys", icon: Key },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Main Navigation Toolbar */}
      <HeaderToolbar />

      <div className="flex flex-1 relative">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-primary text-primary-foreground shadow-2xl"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-16 z-40 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border/80 flex flex-col transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="font-bold text-xs">SaaS Platform</h2>
                <p className="text-[10px] text-muted-foreground">Embedded Support AI</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === "/dashboard/overview" && location.pathname === "/dashboard");
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/60 bg-muted/20">
            <div className="p-3 rounded-xl bg-card border border-border/60 text-[11px] space-y-1">
              <span className="font-bold text-primary block">Embed Ready</span>
              <p className="text-muted-foreground">Single script tag integration for any HTML website.</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
