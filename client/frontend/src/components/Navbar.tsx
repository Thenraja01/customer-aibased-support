import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bot, User, LogOut, ChevronDown, LayoutDashboard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const publicLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Features", path: "/features" },
  { name: "Industries", path: "/industries" },
  { name: "Pricing", path: "/pricing" },
  { name: "Contact", path: "/contact" },
];

const roleNavLinks: Record<string, { name: string; path: string }[]> = {
  super_admin: [
    { name: "Dashboard", path: "/superadmin/dashboard" },
    { name: "Organizations", path: "/superadmin/organizations" },
    { name: "Users", path: "/superadmin/users" },
    { name: "Roles", path: "/superadmin/roles" },
    { name: "Audit Logs", path: "/superadmin/audit-logs" },
  ],
  admin: [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Team", path: "/admin/team" },
    { name: "Documents", path: "/admin/documents" },
    { name: "FAQ", path: "/admin/faq" },
    { name: "Settings", path: "/admin/settings" },
  ],
  support: [
    { name: "Dashboard", path: "/support/dashboard" },
    { name: "Chats", path: "/support/chat" },
    { name: "Tickets", path: "/support/tickets" },
    { name: "FAQ", path: "/support/faq" },
  ],
  customer: [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Chat", path: "/chat" },
    { name: "Tickets", path: "/tickets" },
    { name: "FAQ", path: "/faq" },
  ],
};

function getNormalizedRole(user: any): string {
  if (!user) return "";
  const role = typeof user.role_id === "object" ? user.role_id?.role_name : user.role_id;
  return (role || "").toLowerCase().replace(/\s+/g, "_");
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, orgSettings, logout } = useAuth();
  const { settings: appSettings } = useAppSettings();

  const brandName = appSettings?.app_name || orgSettings?.chatbot_name || user?.organization_id?.name || "SupportAI";
  const brandLogo = appSettings?.logo?.url || orgSettings?.logo?.url || null;
  const role = getNormalizedRole(user);

  const isLoggedIn = !!user;
  const navLinks = isLoggedIn && roleNavLinks[role] ? roleNavLinks[role] : publicLinks;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!user) return "/dashboard";
    switch (role) {
      case "super_admin": return "/superadmin";
      case "admin": return "/admin/dashboard";
      case "support": return "/support/dashboard";
      default: return "/dashboard";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-white/[0.06] dark:shadow-lg dark:shadow-black/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={isLoggedIn ? getDashboardPath() : "/"} className="flex items-center gap-2">
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="h-7 w-auto" />
          ) : (
            <Bot className="h-6 w-6 text-primary" />
          )}
          <span className="text-xl font-bold">{brandName}</span>
        </Link>

        {isLoggedIn && (
          <Link
            to={getDashboardPath()}
            className={cn(
              "lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              location.pathname === getDashboardPath()
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
        )}

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location.pathname === link.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span>{user.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-background shadow-lg">
                  <div className="border-b p-4">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs font-medium capitalize text-primary">{role.replace(/_/g, " ")}</p>
                    {user.organization_id?.name && (
                      <p className="text-xs text-muted-foreground">{user.organization_id.name}</p>
                    )}
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => { navigate(getDashboardPath()); setUserMenuOpen(false); }}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </div>
                  <div className="p-2 pt-0">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive/80"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost" })}>Log In</Link>
              <Link to="/register" className={buttonVariants({ variant: "default" })}>Get Started</Link>
            </>
          )}
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2" onClick={() => setMobileOpen((prev) => !prev)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background lg:hidden">
          <div className="space-y-2 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
              >
                {link.name}
              </Link>
            ))}

            <div className="border-t pt-4">
              {user ? (
                <>
                  <div className="mb-4">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs capitalize text-primary">{role.replace(/_/g, " ")}</p>
                    {user.organization_id?.name && (
                      <p className="text-xs text-muted-foreground">{user.organization_id.name}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => { navigate(getDashboardPath()); setMobileOpen(false); }}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className={buttonVariants({ variant: "outline" })}>Log In</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className={buttonVariants({ variant: "default" })}>Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}