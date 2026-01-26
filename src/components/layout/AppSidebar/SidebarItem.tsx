import { Link, useLocation } from "@tanstack/react-router";
import type React from "react";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to?: string;
  active?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function SidebarItem({ icon: Icon, label, to, active, onClick, badge }: SidebarItemProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const isActive = active || (to && location.pathname === to);

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center w-full rounded-md transition-all duration-200 group relative",
        state === "expanded" ? "px-3 py-2 gap-3" : "justify-center p-2 h-10 w-10 mx-auto",
        isActive
          ? "bg-ui-bg-tertiary text-ui-text-primary font-medium"
          : "text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text-primary",
      )}
    >
      <Icon className={cn("shrink-0", state === "expanded" ? "w-4 h-4" : "w-5 h-5")} />

      {/* Label - Only visible when expanded */}
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
          state === "expanded"
            ? "opacity-100 max-w-[150px]"
            : "opacity-0 max-w-0 pointer-events-none absolute left-10",
        )}
      >
        {label}
      </span>

      {/* Badge - Expanded Only */}
      {badge && state === "expanded" && (
        <span className="ml-auto opacity-100 transition-opacity duration-200">{badge}</span>
      )}
    </button>
  );

  // Wrap in Link if 'to' is provided
  const wrappedContent = to ? (
    <Link to={to} className="w-full">
      {content}
    </Link>
  ) : (
    content
  );

  // If collapsed, wrap in Tooltip
  if (state === "collapsed") {
    return (
      <TooltipRoot delayDuration={0}>
        <TooltipTrigger asChild>{wrappedContent}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-2 bg-ui-bg-primary border border-ui-border-primary text-ui-text-primary shadow-xl"
        >
          {label}
          {badge && <span className="text-xs opacity-70">{badge}</span>}
        </TooltipContent>
      </TooltipRoot>
    );
  }

  return wrappedContent;
}
