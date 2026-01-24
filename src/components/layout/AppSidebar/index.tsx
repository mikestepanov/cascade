import React from "react";
import { SidebarProvider } from "./SidebarContext";
import { SidebarLayout } from "./SidebarLayout";
import { SidebarItem } from "./SidebarItem";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Settings, 
  Users, 
  BarChart2, 
  Inbox, 
  Briefcase, 
  Search,
  PlusSquare,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/features/auth/components/user-button";

// --- Internal Component: The actual Sidebar Content ---
function SidebarContent() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col h-full w-full">
      {/* 1. Header / Workspace Switcher */}
      <div className={cn(
        "h-14 flex items-center px-3 border-b border-ui-border-primary shrink-0",
        state === "expanded" ? "justify-between" : "justify-center"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
           <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center text-white font-bold shrink-0">
             N
           </div>
           <div className={cn(
             "flex flex-col transition-opacity duration-200",
             state === "expanded" ? "opacity-100" : "opacity-0 w-0 hidden"
           )}>
             <span className="text-sm font-semibold truncate">Nixelo</span>
             <span className="text-xs text-ui-text-tertiary truncate">Pro Plan</span>
           </div>
        </div>
      </div>

      {/* 2. Primary Navigation */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <SidebarItem icon={Home} label="Home" to="/" />
        <SidebarItem icon={Inbox} label="Inbox" to="/inbox" badge="12" />
        <SidebarItem icon={Briefcase} label="Projects" to="/projects" />
        <SidebarItem icon={BarChart2} label="Analytics" to="/analytics" />
        <SidebarItem icon={Users} label="Team" to="/team" />
      </div>

      {/* 3. Footer / User & Toggle */}
      <div className="mt-auto p-2 border-t border-ui-border-primary space-y-1">
        <SidebarItem icon={HelpCircle} label="Help & Support" />
        <SidebarItem icon={Settings} label="Settings" to="/settings" />
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 mt-2 text-ui-text-tertiary hover:bg-ui-bg-secondary rounded-md transition-colors"
        >
          {state === "expanded" ? (
            <ChevronsLeft className="w-4 h-4" />
          ) : (
            <ChevronsRight className="w-4 h-4" />
          )}
        </button>

        <div className="pt-2 flex justify-center">
           {/* Placeholder for UserButton - adjust as needed */}
           <div className="w-8 h-8 rounded-full bg-ui-bg-tertiary" /> 
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---
export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarLayout sidebar={<SidebarContent />}>
        {children}
      </SidebarLayout>
    </SidebarProvider>
  );
}
