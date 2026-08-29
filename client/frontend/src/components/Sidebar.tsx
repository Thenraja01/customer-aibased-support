import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Settings,
} from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigationContext, getPathView } from "@/context/NavigationContext";
import { getRoleName, normalizeRoleName } from "@/lib/roles";
import { resolvePortal } from "@/lib/access";
import {
  navigationConfig,
  filterNavigationByRole,
  isActiveRoute,
  type NavItem,
  type UserRole,
} from "@/config/navigation";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, orgSettings, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(authLoading);

  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, loadUnreadCount } = useNotifications();
  const { sidebarOverride, setSidebarOverride } = useNavigationContext();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const base = backendUrl.replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const userAvatarUrl = user?.profileImage || (user as any)?.avatar || (user as any)?.profile_image;
  const [sidebarImgError, setSidebarImgError] = useState(false);

  useEffect(() => {
    setSidebarImgError(false);
  }, [userAvatarUrl]);

  const rawRoles = user?.roles && user.roles.length > 0 ? user.roles : [getRoleName(user)];
  const userRoles: UserRole[] = rawRoles.map(
    (r: string) => normalizeRoleName(r) as UserRole
  );
  const primaryRole = userRoles[0];

  const getBadgeForItem = (item: NavItem, notificationCount: number): string | number | undefined => {
    if (item.label.toLowerCase().includes("notification") && notificationCount > 0) {
      return notificationCount;
    }
    return item.badge;
  };

  const filteredNavigation = filterNavigationByRole(navigationConfig, userRoles).map(item => ({
    ...item,
    badge: getBadgeForItem(item, unreadCount),
    children: item.children?.map(child => ({
      ...child,
      badge: getBadgeForItem(child, unreadCount),
    })),
  }));

  const tenantName = orgSettings?.name || user?.organization_id?.name || "SupportAI";
  const tenantLogo = orgSettings?.logo?.url || null;
  const branchName = user?.branch_id?.name || null;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMobileOpen(false);
      setProfileMenuOpen(false);
    }
  }, []);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.children) {
        setExpandedItems((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(item.path)) {
            newSet.delete(item.path);
          } else {
            newSet.add(item.path);
          }
          return newSet;
        });
      } else {
        navigate(item.path);
        const viewKey = getPathView(item.path);
        if (viewKey) {
          setSidebarOverride(viewKey);
        }
        setMobileOpen(false);
      }
    },
    [navigate, setSidebarOverride]
  );

  const handleLogout = useCallback(() => {
    setProfileMenuOpen(false);
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const getProfilePath = useCallback(() => {
    const portal = resolvePortal(user);
    switch (portal) {
      case "superadmin":
        return "/superadmin/profile";
      case "admin":
        return "/admin/profile";
      case "branch":
        return "/branch/profile";
      case "support":
        return "/support/profile";
      default:
        return "/profile";
    }
  }, [user]);

  const handleProfileAction = useCallback((action: "profile" | "logout") => {
    setProfileMenuOpen(false);
    if (action === "profile") {
      if (window.innerWidth < 768) setMobileOpen(false);
      navigate(getProfilePath());
    } else {
      handleLogout();
    }
  }, [navigate, getProfilePath, handleLogout]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", String(collapsed));
    } catch { }
    window.dispatchEvent(new Event("resize"));
  }, [collapsed]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  const isItemActive = useCallback((path: string, hasChildren: boolean = false) => {
    const viewKey = getPathView(path);
    if (sidebarOverride) {
      return viewKey === sidebarOverride;
    }
    return isActiveRoute(location.pathname, path, hasChildren);
  }, [sidebarOverride, location.pathname]);

  useEffect(() => {
    filteredNavigation.forEach((item) => {
      const isCurrent = isItemActive(item.path, !!item.children);
      const isExpanded = expandedItems.has(item.path);
      const hasChildren = item.children && item.children.length > 0;

      if (hasChildren && isCurrent && !isExpanded) {
        setExpandedItems((prev) => new Set([...prev, item.path]));
      }
    });
  }, [isItemActive, filteredNavigation, expandedItems]);

  if (loading) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border/50 bg-background/95 backdrop-blur-xl p-5",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded-md bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3">
              <div className="h-5 w-5 rounded-md bg-muted animate-pulse" />
              <div className="h-4 flex-1 rounded-md bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border/50 bg-background/95 backdrop-blur-xl p-5",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 opacity-50" />
          </div>
          <p className="text-sm font-medium">Unable to load navigation</p>
        </div>
      </aside>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "border-b border-border/50 transition-all duration-300",
        collapsed ? "p-3" : "p-5"
      )}>
        <div className="flex items-center gap-3">
          {/* Logo: Hover or click to expand when collapsed */}
          <div
            className="relative group cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={() => {
              if (collapsed) setCollapsed(false);
            }}
            title={collapsed ? "Hover or click to expand sidebar" : "Click to collapse"}
          >
            {tenantLogo ? (
              <img
                src={tenantLogo}
                alt={tenantName}
                className={cn(
                  "h-9 w-9 rounded-xl object-cover ring-2 ring-border/50 transition-all duration-300 group-hover:ring-emerald-500/30",
                  collapsed && "group-hover:scale-105"
                )}
              />
            ) : (
              <div className={cn(
                "h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-transform duration-300",
                collapsed && "group-hover:scale-105"
              )}>
                {tenantName.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/10 to-lime-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="font-semibold text-sm truncate leading-tight">{tenantName}</p>
              {branchName && (
                <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 font-medium">
                  {branchName}
                </p>
              )}
            </motion.div>
          )}

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-7 w-7 rounded-lg hover:bg-muted/80 transition-colors"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 sidebar-scrollbar">
        {(() => {
          const grouped = filteredNavigation.reduce((acc, item) => {
            const section = item.section || "OTHER";
            if (!acc[section]) acc[section] = [];
            acc[section].push(item);
            return acc;
          }, {} as Record<string, typeof filteredNavigation>);

          return Object.entries(grouped).map(([section, items], sectionIdx) => {
            const isEmbeddedSection = section === "EMBEDDED AI PLATFORM";
            return (
              <div
                key={section}
                className={cn(
                  "mb-2 transition-all duration-300",
                  sectionIdx !== 0 && "mt-4",
                  isEmbeddedSection && !collapsed && "p-1.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 shadow-xs my-3"
                )}
              >
                {!collapsed && section && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "px-3 pt-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider",
                      isEmbeddedSection
                        ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                        : "text-muted-foreground/60"
                    )}
                  >
                    {section}
                  </motion.div>
                )}
                <div className="space-y-0.5">
                {items.map((item) => {
                  const active = isItemActive(item.path, !!item.children);
                  const expanded = expandedItems.has(item.path);

                  return (
                    <div key={item.path + item.label}>
                      <TooltipPrimitive.Provider delayDuration={collapsed ? 100 : Infinity}>
                        <TooltipPrimitive.Root>
                          <TooltipPrimitive.Trigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start transition-all duration-300 gap-3 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 active:translate-y-0",
                                collapsed ? "justify-center px-2 h-10" : "px-3 h-10",
                                active
                                  ? "text-emerald-500 dark:text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                  : "text-muted-foreground/80 hover:text-foreground"
                              )}
                              onClick={() => handleNavClick(item)}
                              onKeyDown={handleKeyDown}
                            >
                              {/* Active indicator bar */}
                              {active && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b from-emerald-500 to-lime-500"
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                              )}

                              {/* Active background */}
                              <div className={cn(
                                "absolute inset-0 rounded-lg transition-all duration-300",
                                active
                                  ? "bg-gradient-to-r from-emerald-500/8 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/20"
                                  : "bg-transparent group-hover:bg-muted/40"
                              )} />

                              <div className={cn(
                                "relative z-10 flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-300",
                                active
                                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "text-muted-foreground/60 group-hover:text-foreground group-hover:bg-muted/60"
                              )}>
                                <item.icon className="h-[18px] w-[18px]" />
                              </div>

                              {!collapsed && (
                                <>
                                  <span className="relative z-10 flex-1 text-left text-[13px]">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <Badge
                                      variant="destructive"
                                      className="relative z-10 ml-auto h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5 rounded-full shadow-sm shadow-red-500/20"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                  {item.children && (
                                    <ChevronRight
                                      className={cn(
                                        "relative z-10 h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-300",
                                        expanded && "rotate-90 text-emerald-500"
                                      )}
                                    />
                                  )}
                                </>
                              )}
                            </Button>
                          </TooltipPrimitive.Trigger>

                          {collapsed && (
                            <TooltipPrimitive.Portal>
                              <TooltipPrimitive.Content
                                side="right"
                                sideOffset={8}
                                className="bg-popover/95 backdrop-blur-md text-popover-foreground px-3 py-1.5 text-xs font-medium rounded-lg shadow-xl shadow-black/5 border border-border/50"
                              >
                                {item.label}
                                {item.badge && (
                                  <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground px-1">
                                    {item.badge}
                                  </span>
                                )}
                                <TooltipPrimitive.Arrow className="fill-popover/95" />
                              </TooltipPrimitive.Content>
                            </TooltipPrimitive.Portal>
                          )}
                        </TooltipPrimitive.Root>
                      </TooltipPrimitive.Provider>

                      {/* Nested children */}
                      <AnimatePresence>
                        {item.children && expanded && !collapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="ml-5 pl-3 border-l border-border/40 mt-0.5 space-y-0.5">
                              {item.children.map((child) => {
                                const childActive = isItemActive(child.path);
                                return (
                                  <Button
                                    key={child.path + child.label}
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start text-[12.5px] transition-all duration-300 gap-3 h-9 px-3 relative group hover:scale-[1.02] active:scale-95",
                                      childActive
                                        ? "text-emerald-500 dark:text-emerald-400 font-semibold"
                                        : "text-muted-foreground/60 hover:text-foreground"
                                    )}
                                    onClick={() => handleNavClick(child)}
                                    onKeyDown={handleKeyDown}
                                  >
                                    {childActive && (
                                      <motion.div
                                        layoutId="childActiveIndicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-emerald-400"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                      />
                                    )}
                                    <div className={cn(
                                      "h-1.5 w-1.5 rounded-full transition-all duration-300",
                                      childActive
                                        ? "bg-emerald-500 scale-110"
                                        : "bg-muted-foreground/25 group-hover:bg-muted-foreground/50"
                                    )} />
                                    <span className="flex-1 text-left">{child.label}</span>
                                    {child.badge && (
                                      <Badge
                                        variant="destructive"
                                        className="ml-auto h-4 min-w-4 flex items-center justify-center text-[9px] px-1 rounded-full"
                                      >
                                        {child.badge}
                                      </Badge>
                                    )}
                                  </Button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        });
      })()}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-border/50 transition-all duration-300 relative",
        collapsed ? "p-3" : "p-4"
      )}>
        <div className="flex items-center gap-3" ref={profileMenuRef}>
          {/* Profile Avatar with Dropdown */}
          <div className="relative flex-1">
            <div
              className={cn(
                "flex items-center gap-3 cursor-pointer group min-w-0",
                collapsed && "justify-center"
              )}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xs shadow-md shadow-emerald-500/20 ring-2 ring-background overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  {userAvatarUrl && !sidebarImgError ? (
                    <img
                      src={getImageUrl(userAvatarUrl)}
                      alt={user?.name || "Profile"}
                      className="h-full w-full object-cover rounded-full"
                      onError={() => setSidebarImgError(true)}
                    />
                  ) : (
                    <span>
                      {user?.name
                        ? user.name
                          .trim()
                          .split(/\s+/)
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                        : "U"}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
              </div>

              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold truncate leading-tight">{user?.name || "User"}</p>
                  <p className="text-[11px] text-muted-foreground/60 capitalize font-medium truncate">
                    {primaryRole?.replace("_", " ")}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "absolute z-50 bg-popover/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl shadow-black/10 overflow-hidden",
                    collapsed
                      ? "bottom-full left-0 mb-2 w-44"
                      : "bottom-full left-0 mb-2 w-full min-w-[180px]"
                  )}
                >
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => handleProfileAction("profile")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <div className="h-px bg-border/50 mx-2" />
                    <button
                      onClick={() => handleProfileAction("logout")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-background transition-all duration-200"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl shadow-black/5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "w-[68px]" : "w-[236px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          className
        )}
        onKeyDown={handleKeyDown}
      >
        {sidebarContent}
      </motion.aside>

      {/* Main Content Spacer */}
      <div
        className={cn(
          "shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hidden md:block",
          collapsed ? "w-[68px]" : "w-[236px]"
        )}
      />
    </>
  );
}