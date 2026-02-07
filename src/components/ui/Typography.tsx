import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Typography component with semantic variants.
 *
 * Variants are designed for actual use cases, not HTML tags:
 * - h1-h5: Headings with proper hierarchy
 * - p: Body text with paragraph spacing
 * - lead: Intro/subtitle text (larger, secondary color)
 * - large: Emphasized body text
 * - small: Compact body text
 * - muted: De-emphasized text (tertiary color)
 * - meta: Metadata like timestamps, counts, "3d ago" (xs, tertiary)
 * - caption: Descriptions, helper text (xs, secondary)
 * - label: Form labels (sm, medium weight)
 * - mono: Code-like text, issue keys (xs, monospace)
 * - blockquote: Quoted text with left border
 * - inlineCode: Inline code snippets
 *
 * Use `as` prop only when you need a different HTML element (e.g., span inside p).
 * Use `color` prop to override the variant's default color.
 */
const typographyVariants = cva("", {
  variants: {
    variant: {
      // Headings
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight text-ui-text lg:text-5xl",
      h2: "scroll-m-20 text-3xl font-semibold tracking-tight text-ui-text first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-ui-text",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight text-ui-text",
      h5: "scroll-m-20 text-base font-semibold tracking-tight text-ui-text",

      // Body text
      p: "text-base leading-7 text-ui-text [&:not(:first-child)]:mt-4",
      lead: "text-xl text-ui-text-secondary",
      large: "text-lg font-semibold text-ui-text",
      small: "text-sm text-ui-text",
      muted: "text-sm text-ui-text-tertiary",

      // Semantic variants for common patterns
      meta: "text-xs text-ui-text-tertiary", // timestamps, counts, metadata
      caption: "text-xs text-ui-text-secondary", // descriptions, helper text
      label: "text-sm font-medium text-ui-text", // form labels
      mono: "text-xs font-mono text-ui-text-secondary tracking-tight", // issue keys, codes

      // Special
      blockquote: "mt-6 border-l-2 border-ui-border-secondary pl-6 italic text-ui-text",
      list: "my-6 ml-6 list-disc text-ui-text [&>li]:mt-2",
      inlineCode:
        "relative rounded bg-ui-bg-tertiary px-1.5 py-0.5 font-mono text-sm font-semibold text-ui-text",
    },
    color: {
      auto: "", // Use variant's default color
      default: "text-ui-text",
      secondary: "text-ui-text-secondary",
      tertiary: "text-ui-text-tertiary",
      brand: "text-brand",
      error: "text-status-error",
      success: "text-status-success",
      warning: "text-status-warning",
      info: "text-status-info",
      accent: "text-accent",
    },
  },
  defaultVariants: {
    variant: "p",
    color: "auto",
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof typographyVariants> {
  /** Override the default HTML element */
  as?: React.ElementType;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    const Component = as || mapVariantToTag(variant);

    return (
      <Component
        ref={ref}
        className={cn(typographyVariants({ variant, color }), className)}
        {...props}
      />
    );
  },
);
Typography.displayName = "Typography";

function mapVariantToTag(variant: TypographyProps["variant"]): React.ElementType {
  switch (variant) {
    case "h1":
      return "h1";
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    case "h4":
      return "h4";
    case "h5":
      return "h5";
    case "p":
    case "lead":
    case "large":
    case "small":
    case "muted":
    case "meta":
    case "caption":
    case "label":
      return "p";
    case "mono":
      return "span";
    case "blockquote":
      return "blockquote";
    case "list":
      return "ul";
    case "inlineCode":
      return "code";
    default:
      return "p";
  }
}
