import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
}

export function PageLayout({ children, maxWidth = "full", className }: PageLayoutProps): ReactNode {
  return <div className={cn("p-6", maxWidthClasses[maxWidth], className)}>{children}</div>;
}
