import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Sun, Moon, User, LogOut, ChevronDown } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { getRoleName, normalizeRoleName } from "@/lib/roles";

export const HeaderToolbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { unreadCount } = useNotifications();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNotificationsClick = () => {
    const role = normalizeRoleName(getRoleName(user));
    if (role === "customer") {
      navigate("/customer/notifications");
    } else if (role === "branch_admin") {
      navigate("/branch/notifications");
    } else if (role === "support") {
      navigate("/support/notifications");
    } else if (role === "super_admin") {
      navigate("/superadmin/notifications");
    } else {
      navigate("/admin/notifications");
    }
  };

  const handleProfileClick = () => {
    setShowUserDropdown(false);
    const role = normalizeRoleName(getRoleName(user));
    if (role === "customer") navigate("/customer/profile");
    else if (role === "branch_admin") navigate("/branch/profile");
    else if (role === "support") navigate("/support/profile");
    else if (role === "super_admin") navigate("/superadmin/profile");
    else navigate("/admin/profile");
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    logout();
    navigate("/login");
  };

  const roleLabel = (getRoleName(user) || "User").toUpperCase().replace("_", " ");

  const userAvatar = user?.profileImage || (user as any)?.avatar || (user as any)?.profile_image || (user as any)?.image;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [userAvatar]);

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const base = backendUrl.replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const renderAvatar = (textClass = "text-xs") => {
    if (userAvatar && !imgError) {
      return (
        <img
          src={getImageUrl(userAvatar)}
          alt={user?.name || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <span className={`font-bold tracking-tight text-white ${textClass}`}>
        {initials}
      </span>
    );
  };

  return (
    <div className="top-right-actions absolute top-4 right-4 md:top-5 md:right-6 z-50 flex items-center gap-2">
      {/* 1. Notification Bell Shortcut */}
      <button
        onClick={handleNotificationsClick}
        className="relative p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition shadow-lg backdrop-blur-md"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse border-2 border-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Theme Toggle Shortcut */}
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition shadow-lg backdrop-blur-md"
        title="Toggle Theme"
      >
        {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
      </button>

      {/* 3. User Profile Dropdown Shortcut */}
      <div className="profile-wrapper relative">
        <button
          onClick={() => setShowUserDropdown((prev) => !prev)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-200 transition shadow-lg backdrop-blur-md"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white border border-indigo-400/30 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {renderAvatar("text-xs")}
          </div>
          <div className="hidden sm:flex flex-col items-start text-left">
            <span className="text-xs font-semibold text-slate-100 leading-none">{user?.name || "User"}</span>
            <span className="text-[10px] text-indigo-400 font-medium leading-none mt-0.5">{roleLabel}</span>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {showUserDropdown && (
          <div className="profile-dropdown absolute right-0 top-[calc(100%+8px)] z-[1000] w-56 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in duration-150">
            <div className="px-3 py-2 border-b border-slate-800/80 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white border border-indigo-400/30 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                {renderAvatar("text-sm")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <User size={15} className="text-indigo-400" /> Account Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderToolbar;
