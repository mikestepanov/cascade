import * as React from "react";
import { cn } from "@/lib/utils";

type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";

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
  baseline: "items-baseline",
};

const justifyClasses: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Gap between items */
  gap?: GapSize;
  /** Align items on cross axis */
  align?: Align;
  /** Justify content on main axis */
  justify?: Justify;
  /** Wrap items */
  wrap?: boolean;
  /** Use inline-flex instead of flex */
  inline?: boolean;
  /** Render as a different element */
  as?: React.ElementType;
}

/**
 * Flex layout component - horizontal by default.
 *
 * @example
 * <Flex gap="sm" align="center">
 *   <Icon />
 *   <span>Label</span>
 * </Flex>
 *
 * @example
 * <Flex justify="between" align="center">
 *   <h1>Title</h1>
 *   <Button>Action</Button>
 * </Flex>
 */
export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      gap = "none",
      align,
      justify,
      wrap = false,
      inline = false,
      as: Component = "div",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          inline ? "inline-flex" : "flex",
          gapClasses[gap],
          align && alignClasses[align],
          justify && justifyClasses[justify],
          wrap && "flex-wrap",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Flex.displayName = "Flex";
