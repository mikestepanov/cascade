import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "neutral"
    | "brand"
    | "accent";
  size?: "sm" | "md";
  shape?: "rounded" | "pill";
  className?: string;
}

/**
 * Reusable badge component for tags, labels, and status indicators
 */
export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  shape = "rounded",
  className = "",
}: BadgeProps) {
  const variantClasses = {
    primary: "bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300",
    secondary:
      "bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark text-ui-text-primary dark:text-ui-text-primary-dark",
    success:
      "bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark",
    error:
      "bg-status-error-bg dark:bg-status-error-dark text-status-error dark:text-status-error-dark",
    warning:
      "bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark",
    info: "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300",
    neutral:
      "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark",
    brand: "bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200",
    accent: "bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2 py-1",
  };

  const shapeClasses = {
    rounded: "rounded",
    pill: "rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        variantClasses[variant],
        sizeClasses[size],
        shapeClasses[shape],
        className,
      )}
    >
      {children}
    </span>
  );
}
