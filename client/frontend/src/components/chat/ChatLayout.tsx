"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function ChatLayout({ sidebar, children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-[280px] md:flex-shrink-0 border-r dark:border-white/[0.06]">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={closeSidebar}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r dark:border-white/[0.06] md:hidden"
            >
              <div className="flex items-center justify-end p-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={closeSidebar}
                  className="rounded-lg"
                >
                  <X size={18} />
                </Button>
              </div>
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className={cn(
            "absolute top-3 left-3 z-30 rounded-lg md:hidden",
            "bg-background/80 backdrop-blur-sm shadow-sm"
          )}
        >
          <Menu size={18} />
        </Button>
        {children}
      </div>
    </div>
  );
}
