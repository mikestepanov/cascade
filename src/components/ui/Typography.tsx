import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-ui-text", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      p: "leading-7 [&:not(:first-child)]:mt-6",
      blockquote: "mt-6 border-l-2 border-ui-border-secondary pl-6 italic",
      list: "my-6 ml-6 list-disc [&>li]:mt-2",
      inlineCode:
        "relative rounded bg-ui-bg-tertiary px-1.5 py-0.5 font-mono text-sm font-semibold",
      lead: "text-xl text-ui-text-secondary",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-ui-text-tertiary",
    },
    color: {
      default: "text-ui-text",
      secondary: "text-ui-text-secondary",
      tertiary: "text-ui-text-tertiary",
      primary: "text-brand", // Justified exception for brand color unless I use semantic brand token
      error: "text-status-error",
      success: "text-status-success",
      warning: "text-status-warning",
      info: "text-status-info",
      accent: "text-accent", // Justified exception for accent
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, size, as, ...props }, ref) => {
    const Component = as || mapVariantToTag(variant);

    return (
      <Component
        ref={ref}
        className={cn(typographyVariants({ variant, color, size, className }))}
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
    case "p":
    case "lead":
    case "large":
    case "muted":
    case "small":
      return "p";
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
