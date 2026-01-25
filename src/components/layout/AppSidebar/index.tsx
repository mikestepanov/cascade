import {
  BarChart2,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Home,
  Inbox,
  Settings,
  Users,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ROUTES } from "@/config/routes";
import { UserButton } from "@/features/auth/components/user-button";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { SidebarItem } from "./SidebarItem";
import { SidebarLayout } from "./SidebarLayout";

// --- Internal Component: The actual Sidebar Content ---
function SidebarContent() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col h-full w-full">
      {/* 1. Header / Workspace Switcher */}
      <div
        className={cn(
          "h-14 flex items-center px-3 border-b border-ui-border-primary shrink-0",
          state === "expanded" ? "justify-between" : "justify-center",
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center text-white font-bold shrink-0">
            N
          </div>
          <div
            className={cn(
              "flex flex-col transition-opacity duration-200",
              state === "expanded" ? "opacity-100" : "opacity-0 w-0 hidden",
            )}
          >
            <span className="text-sm font-semibold truncate">Nixelo</span>
            <span className="text-xs text-ui-text-tertiary truncate">Pro Plan</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <SidebarItem icon={Home} label="Home" to={ROUTES.home.path} />
        <SidebarItem icon={Inbox} label="Inbox" to={ROUTES.inbox.path} badge="12" />
        <SidebarItem icon={Briefcase} label="Projects" to={ROUTES.projects.list.path} />
        <SidebarItem icon={BarChart2} label="Analytics" to={ROUTES.analytics.path} />
        <SidebarItem icon={Users} label="Team" to={ROUTES.team.path} />
      </div>

      {/* 3. Footer / User & Toggle */}
      <div className="mt-auto p-2 border-t border-ui-border-primary space-y-1">
        <SidebarItem icon={HelpCircle} label="Help & Support" />
        <SidebarItem icon={Settings} label="Settings" to="/settings" />

        {/* Toggle Button */}
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="w-full mt-2">
          {state === "expanded" ? (
            <ChevronsLeft className="w-4 h-4" />
          ) : (
            <ChevronsRight className="w-4 h-4" />
          )}
        </Button>

        <div className="pt-2 flex justify-center">
          <UserButton />
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---
export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <SidebarLayout sidebar={<SidebarContent />}>{children}</SidebarLayout>
      </TooltipProvider>
    </SidebarProvider>
  );
}
