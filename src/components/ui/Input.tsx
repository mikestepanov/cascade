import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ui-text-tertiary dark:placeholder:text-ui-text-tertiary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-ui-border-primary dark:border-ui-border-primary-dark",
        error: "border-status-error dark:border-status-error focus-visible:ring-status-error",
      },
      inputSize: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Error message to display */
  error?: string;
  /** Size variant for the input */
  inputSize?: "sm" | "md" | "lg";
}

/**
 * Input component for text entry.
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter text..." />
 *
 * // With error state
 * <Input variant="error" error="This field is required" />
 *
 * // Different sizes
 * <Input inputSize="lg" placeholder="Large input" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            inputVariants({ variant: error ? "error" : variant, inputSize }),
            className,
          )}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-status-error dark:text-status-error">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
