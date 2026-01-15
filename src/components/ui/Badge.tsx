import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center font-medium", {
  variants: {
    variant: {
      primary: "bg-brand-100 text-brand-800",
      secondary: "bg-ui-bg-secondary text-ui-text-primary",
      success: "bg-status-success-bg text-status-success-text",
      error: "bg-status-error-bg text-status-error-text",
      warning: "bg-status-warning-bg text-status-warning-text",
      info: "bg-brand-50 text-brand-700",
      neutral: "bg-ui-bg-tertiary text-ui-text-secondary",
      brand: "bg-brand-100 text-brand-800",
      accent: "bg-accent-100 text-accent-800",
    },
    size: {
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2 py-1",
    },
    shape: {
      rounded: "rounded",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "sm",
    shape: "rounded",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component for tags, labels, and status indicators.
 *
 * @example
 * // Default badge
 * <Badge>Tag</Badge>
 *
 * // Success badge
 * <Badge variant="success">Active</Badge>
 *
 * // Pill-shaped badge
 * <Badge variant="brand" shape="pill">New</Badge>
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, shape, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
