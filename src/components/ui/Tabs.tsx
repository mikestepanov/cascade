import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabProps {
  value: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Individual tab button component
 */
export function Tab({ value, isActive, onClick, children, className = "" }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap",
        isActive
          ? "border-brand-500 text-brand-600 dark:text-brand-400"
          : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-primary dark:hover:border-ui-border-primary-dark",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      role="tab"
      aria-selected={isActive}
      id={`tab-${value}`}
      aria-controls={`tabpanel-${value}`}
    >
      {children}
    </button>
  );
}

interface TabsProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Tabs container component
 */
export function Tabs({ children, className = "", "aria-label": ariaLabel }: TabsProps) {
  return (
    <div
      className={cn(
        "border-b border-ui-border-primary dark:border-ui-border-primary-dark overflow-x-auto",
        className,
      )}
    >
      <div className="-mb-px flex gap-4 sm:gap-8 min-w-max" aria-label={ariaLabel} role="tablist">
        {children}
      </div>
    </div>
  );
}

interface TabPanelProps {
  value: string;
  isActive: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Tab panel component for tab content
 */
export function TabPanel({ value, isActive, children, className = "" }: TabPanelProps) {
  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
