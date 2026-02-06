import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

const textareaVariants = cva(
  "flex min-h-20 w-full rounded-lg border bg-ui-bg-soft px-3 py-2 text-sm text-ui-text transition-[border-color] duration-150 placeholder:text-ui-text-tertiary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-ui-border focus-visible:border-brand",
        error: "border-status-error focus-visible:border-status-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
}

/**
 * Textarea component for multi-line text entry.
 *
 * @example
 * // Basic textarea
 * <Textarea placeholder="Enter description..." />
 *
 * // With error state
 * <Textarea variant="error" error="Description is required" />
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, error, ...props }, ref) => {
    const computedVariant = error ? "error" : variant;

    return (
      <div className="w-full">
        <textarea
          className={cn(textareaVariants({ variant: computedVariant, className }))}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <Typography variant="muted" className="mt-1 text-sm text-status-error">
            {error}
          </Typography>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
