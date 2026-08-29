import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthContext } from "./AuthContext";

// Define views available in each role context
export type ActiveView = 
  // Customer Views
  | "customer-dashboard" | "customer-chat" | "customer-tickets" | "customer-faq" | "customer-notifications" | "customer-chat-history" | "customer-documents" | "customer-profile"
  // Support Views
  | "support-dashboard" | "support-tickets" | "support-queue" | "support-documents" | "support-faq" | "support-notifications" | "support-chat" | "support-chat-history" | "support-profile"
  // Admin Views
  | "admin-dashboard" | "admin-users" | "admin-team" | "admin-roles" | "admin-branches" | "admin-pending-approvals" | "admin-faq" | "admin-ai" | "admin-knowledge-gaps" | "admin-queue" | "admin-chat-history" | "admin-notifications" | "admin-documents" | "admin-topics" | "admin-verifications" | "admin-document-types" | "admin-settings" | "admin-send-notification" | "admin-ai-analytics" | "admin-chatbot" | "admin-ai-sessions" | "admin-profile" | "admin-tickets" | "admin-tickets-escalated" | "admin-tickets-templates" | "admin-tickets-form-customization"
  // SuperAdmin Views
  | "superadmin-dashboard" | "superadmin-command-center" | "superadmin-organizations" | "superadmin-users" | "superadmin-pending-org-admins" | "superadmin-roles" | "superadmin-ai-analytics" | "superadmin-chat-history" | "superadmin-search" | "superadmin-notifications" | "superadmin-notifications-send" | "superadmin-audit-logs" | "superadmin-profile" | "superadmin-tickets" | "superadmin-tickets-escalated" | "superadmin-tickets-templates" | "superadmin-tickets-form-customization"
  // Branch Views
  | "branch-dashboard" | "branch-tickets" | "branch-ticket-detail" | "branch-agents" | "branch-customers" | "branch-knowledge" | "branch-faq" | "branch-sla" | "branch-analytics" | "branch-notifications" | "branch-settings" | "branch-documents" | "branch-branches" | "branch-profile" | "support-ticket-detail" | "customer-ticket-detail"
  // AI Workspace
  | "ai-workspace";

export interface NavigationState {
  activeView: ActiveView;
  activePrimaryId: string | null;
  activePath: string;
  setActiveView: (view: ActiveView) => void;
  setActivePrimary: (primaryId: string) => void;
  direction: number; // -1 for left, 1 for right (slide direction)
  sidebarOverride: ActiveView | null;
  setSidebarOverride: (view: ActiveView | null) => void;
}

const NavigationContext = createContext<NavigationState | null>(null);

export function getPathView(path: string): ActiveView | null {
  // Customer sync
  if (path === "/dashboard" || path === "/customer/dashboard") return "customer-dashboard";
  else if (path === "/chat-history" || path === "/customer/chat-history") return "customer-chat-history";
  else if (path === "/chat" || path === "/customer/chat") return "customer-chat";
  else if (path === "/tickets" || path === "/customer/tickets") return "customer-tickets";
  else if (path === "/faq" || path === "/customer/faq") return "customer-faq";
  else if (path === "/notifications" || path === "/customer/notifications") return "customer-notifications";
  else if (path === "/documents" || path === "/customer/documents") return "customer-documents";
  else if (path === "/profile" || path === "/customer/profile") return "customer-profile";

  // Support sync
  else if (path === "/support/dashboard") return "support-dashboard";
  else if (path === "/support/tickets") return "support-tickets";
  else if (path === "/support/queue") return "support-queue";
  else if (path === "/support/documents") return "support-documents";
  else if (path === "/support/faq") return "support-faq";
  else if (path === "/support/notifications") return "support-notifications";
  else if (path === "/support/chat-history") return "support-chat-history";
  else if (path === "/support/chat") return "support-chat";
  else if (path === "/support/profile") return "support-profile";

  // Admin sync
  else if (path === "/admin/dashboard") return "admin-dashboard";
  else if (path === "/admin/users") return "admin-users";
  else if (path === "/admin/team") return "admin-team";
  else if (path === "/admin/roles") return "admin-roles";
  else if (path === "/admin/branches") return "admin-branches";
  else if (path === "/admin/tickets") return "admin-tickets";
  else if (path === "/admin/tickets/escalated") return "admin-tickets-escalated";
  else if (path === "/admin/tickets/templates") return "admin-tickets-templates";
  else if (path === "/admin/tickets/form-customization") return "admin-tickets-form-customization";
  else if (path === "/admin/pending-approvals") return "admin-pending-approvals";
  else if (path === "/admin/faq") return "admin-faq";
  else if (path === "/admin/ai") return "admin-ai";
  else if (path === "/admin/knowledge-gaps") return "admin-knowledge-gaps";
  else if (path === "/admin/queue") return "admin-queue";
  else if (path === "/admin/chat-history") return "admin-chat-history";
  else if (path === "/admin/notifications") return "admin-notifications";
  else if (path === "/admin/notifications/send") return "admin-send-notification";
  else if (path === "/admin/documents") return "admin-documents";
  else if (path === "/admin/topics") return "admin-topics";
  else if (path === "/admin/verifications") return "admin-verifications";
  else if (path === "/admin/document-types") return "admin-document-types";
  else if (path === "/admin/settings") return "admin-settings";
  else if (path === "/admin/chatbot") return "admin-chatbot";
  else if (path === "/admin/ai-sessions") return "admin-ai-sessions";
  else if (path === "/admin/ai-analytics") return "admin-ai-analytics";
  else if (path === "/admin/profile") return "admin-profile";

  // SuperAdmin sync
  else if (path === "/superadmin/dashboard") return "superadmin-dashboard";
  else if (path === "/superadmin/command-center") return "superadmin-command-center";
  else if (path === "/superadmin/organizations") return "superadmin-organizations";
  else if (path === "/superadmin/users") return "superadmin-users";
  else if (path === "/superadmin/roles") return "superadmin-roles";
  else if (path === "/superadmin/tickets") return "superadmin-tickets";
  else if (path === "/superadmin/tickets/escalated") return "superadmin-tickets-escalated";
  else if (path === "/superadmin/tickets/templates") return "superadmin-tickets-templates";
  else if (path === "/superadmin/tickets/form-customization") return "superadmin-tickets-form-customization";
  else if (path === "/superadmin/audit-logs") return "superadmin-audit-logs";
  else if (path === "/superadmin/notifications/send") return "superadmin-notifications-send";
  else if (path === "/superadmin/notifications") return "superadmin-notifications";
  else if (path === "/superadmin/ai-analytics") return "superadmin-ai-analytics";
  else if (path === "/superadmin/search") return "superadmin-search";
  else if (path === "/superadmin/chat-history") return "superadmin-chat-history";
  else if (path === "/superadmin/chatbot") return "superadmin-chat-history";
  else if (path === "/superadmin/profile") return "superadmin-profile";
  else if (path === "/superadmin/pending-org-admins") return "superadmin-pending-org-admins";

  // Branch sync
  else if (path === "/branch/dashboard" || path === "/branch-admin/dashboard") return "branch-dashboard";
  else if (path.startsWith("/branch/tickets/")) return "branch-ticket-detail";
  else if (path === "/branch/tickets" || path === "/branch-admin/tickets") return "branch-tickets";
  else if (path.startsWith("/support/tickets/")) return "support-ticket-detail";
  else if (path.startsWith("/tickets/")) return "customer-ticket-detail";
  else if (path === "/branch/agents" || path === "/branch-admin/agents") return "branch-agents";
  else if (path === "/branch/customers" || path === "/branch-admin/customers") return "branch-customers";
  else if (path === "/branch/knowledge" || path === "/branch-admin/knowledge") return "branch-knowledge";
  else if (path === "/branch/faq" || path === "/branch-admin/faq") return "branch-faq";
  else if (path === "/branch/sla" || path === "/branch-admin/sla") return "branch-sla";
  else if (path === "/branch/analytics" || path === "/branch-admin/analytics") return "branch-analytics";
  else if (path === "/branch/notifications" || path === "/branch-admin/notifications") return "branch-notifications";
  else if (path === "/branch/settings" || path === "/branch-admin/settings") return "branch-settings";
  else if (path === "/branch/documents" || path === "/branch-admin/documents") return "branch-documents";
  else if (path === "/branch/branches" || path === "/branch-admin/branches") return "branch-branches";
  else if (path === "/branch/profile" || path === "/branch-admin/profile") return "branch-profile";

  return null;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveViewState] = useState<ActiveView>("customer-dashboard");
  const [activePrimaryId, setActivePrimaryId] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(1);
  const [sidebarOverride, setSidebarOverrideState] = useState<ActiveView | null>(null);
  const { user } = useAuthContext();
  const location = useLocation();

  // Helper list to calculate vertical index positioning in sidebars to determine slide direction
  const viewOrder: ActiveView[] = useMemo(() => [
    // Customer
    "customer-dashboard", "customer-chat", "customer-tickets", "customer-faq", "customer-notifications", "customer-chat-history", "customer-documents", "customer-profile",
    // Support
    "support-dashboard", "support-tickets", "support-queue", "support-documents", "support-faq", "support-notifications", "support-chat", "support-chat-history",
    // Admin
    "admin-dashboard", "admin-users", "admin-team", "admin-roles", "admin-branches", "admin-pending-approvals", "admin-faq", "admin-ai", "admin-knowledge-gaps", "admin-queue", "admin-chat-history", "admin-notifications", "admin-documents", "admin-topics", "admin-verifications", "admin-document-types", "admin-settings", "admin-send-notification", "admin-ai-analytics", "admin-chatbot", "admin-ai-sessions",
    // SuperAdmin
    "superadmin-dashboard", "superadmin-command-center", "superadmin-organizations", "superadmin-users", "superadmin-pending-org-admins", "superadmin-roles", "superadmin-ai-analytics", "superadmin-chat-history", "superadmin-search", "superadmin-notifications", "superadmin-notifications-send", "superadmin-audit-logs",
    // Branch
    "branch-dashboard", "branch-documents", "branch-branches"
  ], []);

  const setActiveView = useCallback((newView: ActiveView) => {
    const currentIndex = viewOrder.indexOf(activeView);
    const newIndex = viewOrder.indexOf(newView);
    if (currentIndex !== -1 && newIndex !== -1) {
      setDirection(newIndex > currentIndex ? 1 : -1);
    }
    setActiveViewState(newView);
  }, [activeView]);

  const setActivePrimary = useCallback((primaryId: string) => {
    setActivePrimaryId(primaryId);
  }, []);

  const setSidebarOverride = useCallback((newView: ActiveView | null) => {
    if (newView !== null) {
      const currentIndex = viewOrder.indexOf(sidebarOverride || activeView);
      const newIndex = viewOrder.indexOf(newView);
      if (currentIndex !== -1 && newIndex !== -1) {
        setDirection(newIndex > currentIndex ? 1 : -1);
      }
    }
    setSidebarOverrideState(newView);
  }, [sidebarOverride, activeView, viewOrder]);

  // Sync initial view state from router path if deep linked, while preserving router integrity
  useEffect(() => {
    // Whenever the URL changes, it implies router navigation (e.g., deep link or internal link).
    // So we must clear any sidebar override to return control to the router!
    setSidebarOverrideState(null);
    const view = getPathView(location.pathname);
    if (view) setActiveViewState(view);
  }, [location.pathname]);

  // Determine active primary from current route
  useEffect(() => {
    const path = location.pathname;
    let primaryId: string | null = null;

    // Customer
    if (path === "/dashboard") primaryId = "dashboard";
    else if (path.startsWith("/chat")) primaryId = "chat";
    else if (path.startsWith("/tickets")) primaryId = "tickets";
    else if (path === "/faq") primaryId = "faq";
    else if (path === "/documents") primaryId = "documents";
    else if (path === "/notifications") primaryId = "settings";

    // Support
    else if (path === "/support/dashboard") primaryId = "dashboard";
    else if (path.startsWith("/support/tickets") || path.startsWith("/support/queue") || path.startsWith("/support/chat")) primaryId = "support";
    else if (path === "/support/documents" || path === "/support/faq") primaryId = "knowledge";

    // Admin
    else if (path === "/admin/dashboard") primaryId = "dashboard";
    else if (path.startsWith("/admin/users") || path.startsWith("/admin/team") || path.startsWith("/admin/roles") || path.startsWith("/admin/branches") || path.startsWith("/admin/pending-approvals")) primaryId = "organization";
    else if (path.startsWith("/admin/documents") || path.startsWith("/admin/topics") || path.startsWith("/admin/verifications") || path.startsWith("/admin/document-types") || path.startsWith("/admin/faq") || path.startsWith("/admin/knowledge-gaps")) primaryId = "knowledge";
    else if (path.startsWith("/admin/queue") || path.startsWith("/admin/chat-history") || path.startsWith("/admin/notifications")) primaryId = "support";
    else if (path.startsWith("/admin/ai") || path.startsWith("/admin/chatbot") || path.startsWith("/admin/ai-sessions") || path.startsWith("/admin/ai-analytics")) primaryId = "ai";
    else if (path.startsWith("/admin/settings")) primaryId = "settings";

    // SuperAdmin
    else if (path === "/superadmin/dashboard") primaryId = "dashboard";
    else if (path.startsWith("/superadmin/organizations") || path.startsWith("/superadmin/users") || path.startsWith("/superadmin/roles") || path.startsWith("/superadmin/pending-org-admins")) primaryId = "organization";
    else if (path.startsWith("/superadmin/ai-analytics")) primaryId = "knowledge";
    else if (path.startsWith("/superadmin/chat-history") || path.startsWith("/superadmin/search")) primaryId = "support";
    else if (path.startsWith("/superadmin/notifications") || path.startsWith("/superadmin/audit-logs") || path.startsWith("/superadmin/app-settings")) primaryId = "platform";

    // Branch
    else if (path.startsWith("/branch/")) {
      if (path === "/branch/dashboard") primaryId = "dashboard";
      else if (path === "/branch/documents") primaryId = "documents";
      else if (path === "/branch/branches") primaryId = "branches";
    }

    if (primaryId) {
      setActivePrimaryId(primaryId);
    }
  }, [location.pathname]);

  // Set default view on user mount based on role
  useEffect(() => {
    if (!user) return;
    const roleName = user.role_id?.role_name || user.role || "";
    if (roleName === "super_admin") {
      setActiveViewState("superadmin-dashboard");
      setActivePrimaryId("dashboard");
    } else if (roleName === "admin") {
      setActiveViewState("admin-dashboard");
      setActivePrimaryId("dashboard");
    } else if (roleName === "branch_admin") {
      setActiveViewState("branch-dashboard");
      setActivePrimaryId("dashboard");
    } else if (roleName === "support") {
      setActiveViewState("support-dashboard");
      setActivePrimaryId("dashboard");
    } else {
      setActiveViewState("customer-dashboard");
      setActivePrimaryId("dashboard");
    }
  }, [user]);

  return (
    <NavigationContext.Provider value={{ 
      activeView, 
      setActiveView, 
      activePrimaryId,
      setActivePrimary,
      activePath: location.pathname,
      direction,
      sidebarOverride,
      setSidebarOverride
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigationContext must be used within NavigationProvider");
  return ctx;
}

// Slide transition container for views
export function SlideTransition({ children, viewKey }: { children: React.ReactNode; viewKey: string }) {
  const { direction } = useNavigationContext();

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="relative overflow-hidden w-full h-full">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={viewKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 380, damping: 30 },
            opacity: { duration: 0.15 }
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}