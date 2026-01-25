import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

export function SidebarLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const { state, isMobile, isOpenMobile, closeMobileMenu, toggleSidebar } = useSidebar();

  // CSS Variables for smooth pure-css transitions where possible
  // constant widths removed in favor of tailwind classes

  return (
    <div className="flex min-h-screen w-full bg-ui-bg-base overflow-hidden">
      {/* --- Desktop Sidebar --- */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-ui-border-primary bg-ui-bg-secondary/50 backdrop-blur-xl transition-[width] duration-300 ease-in-out will-change-[width] z-20",
          state === "expanded" ? "w-60" : "w-14",
        )}
      >
        {sidebar}
      </aside>

      {/* --- Mobile Sidebar (Off-Canvas Drawer) --- */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300",
              isOpenMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
            onClick={closeMobileMenu}
          />
          {/* Drawer */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 w-72 bg-ui-bg-secondary border-r border-ui-border-primary z-50 shadow-2xl transform transition-transform duration-300 ease-in-out",
              isOpenMobile ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {sidebar}
          </aside>
        </>
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Mobile Header / Toggle */}
        {isMobile && (
          <header className="h-14 border-b border-ui-border-primary flex items-center px-4 bg-ui-bg-primary">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="ml-3 font-semibold text-sm">Nixelo</span>
          </header>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}
