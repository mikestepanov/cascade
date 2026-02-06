import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Mintlify-inspired toast notification component.
 *
 * Features:
 * - Elevated background with ultra-subtle borders
 * - Slide-up animation
 * - Proper text hierarchy
 * - Status colors for success/error variants
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast bg-ui-bg-elevated border border-ui-border/50 rounded-lg shadow-elevated p-4 animate-slide-up flex items-start gap-3 w-full max-w-sm",
          title: "text-sm font-semibold text-ui-text",
          description: "text-sm text-ui-text-secondary mt-1 opacity-90",
          actionButton:
            "bg-brand text-brand-foreground px-3 py-1.5 rounded text-sm font-medium hover:bg-brand-hover transition-default",
          cancelButton:
            "bg-ui-bg-tertiary text-ui-text-secondary px-3 py-1.5 rounded text-sm font-medium hover:bg-ui-bg-hover transition-default",
          closeButton:
            "absolute right-2 top-2 rounded-md p-1 text-ui-text-tertiary opacity-70 hover:opacity-100 hover:bg-ui-bg-tertiary transition-default",
          success: "border-status-success/20 [&>[data-icon]]:text-status-success",
          error: "border-status-error/20 [&>[data-icon]]:text-status-error",
          warning: "border-status-warning/20 [&>[data-icon]]:text-status-warning",
          info: "border-status-info/20 [&>[data-icon]]:text-status-info",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
