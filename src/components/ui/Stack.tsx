import * as React from "react";
import { cn } from "@/lib/utils";

type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch";

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

const alignClasses: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Gap between items */
  gap?: GapSize;
  /** Align items horizontally */
  align?: Align;
  /** Render as a different element */
  as?: React.ElementType;
}

/**
 * Stack layout component - vertical flex column.
 *
 * @example
 * <Stack gap="md">
 *   <Input label="Name" />
 *   <Input label="Email" />
 *   <Button>Submit</Button>
 * </Stack>
 *
 * @example
 * <Stack gap="sm" align="center">
 *   <Avatar />
 *   <span>Username</span>
 * </Stack>
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap = "md", align, as: Component = "div", className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn("flex flex-col", gapClasses[gap], align && alignClasses[align], className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Stack.displayName = "Stack";
