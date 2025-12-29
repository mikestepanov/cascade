import { cn } from "@/lib/utils";

interface XIconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

/**
 * Close/X icon component
 * Commonly used in modals, dialogs, and dismissible elements
 */
export function XIcon({ className = "w-6 h-6", "aria-hidden": ariaHidden = true }: XIconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      className={cn(className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <title>Close</title>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
