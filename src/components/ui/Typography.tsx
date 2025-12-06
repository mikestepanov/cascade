import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-ui-text-primary dark:text-ui-text-primary-dark", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 border-b border-ui-border-primary dark:border-ui-border-primary-dark pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      p: "leading-7 [&:not(:first-child)]:mt-6",
      blockquote:
        "mt-6 border-l-2 border-ui-border-secondary dark:border-ui-border-secondary-dark pl-6 italic",
      list: "my-6 ml-6 list-disc [&>li]:mt-2",
      inlineCode:
        "relative rounded bg-ui-bg-tertiary dark:bg-ui-bg-secondary-dark px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      lead: "text-xl text-ui-text-secondary dark:text-ui-text-secondary-dark",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark",
    },
    color: {
      default: "text-ui-text-primary dark:text-ui-text-primary-dark",
      secondary: "text-ui-text-secondary dark:text-ui-text-secondary-dark",
      tertiary: "text-ui-text-tertiary dark:text-ui-text-tertiary-dark",
      primary: "text-brand-600 dark:text-brand-400",
      error: "text-status-error dark:text-status-error-text-dark",
      success: "text-status-success dark:text-status-success-text-dark",
      warning: "text-status-warning dark:text-status-warning-text-dark",
      info: "text-status-info dark:text-status-info-text-dark",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

export function Typography({ className, variant, color, as, ...props }: TypographyProps) {
  const Component = as || mapVariantToTag(variant);

  return <Component className={cn(typographyVariants({ variant, color, className }))} {...props} />;
}

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
