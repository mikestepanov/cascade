import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Reusable input component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ui-text-primary mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3 py-2 border rounded-md text-sm",
            "bg-ui-bg-primary dark:bg-ui-bg-primary-dark",
            "text-ui-text-primary dark:text-ui-text-primary-dark",
            "placeholder-ui-text-tertiary dark:placeholder-ui-text-tertiary-dark",
            "focus:outline-none focus:ring-2 focus:ring-ui-border-focus dark:focus:ring-ui-border-focus-dark focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-ui-border-error dark:border-ui-border-error-dark"
              : "border-ui-border-primary dark:border-ui-border-primary-dark",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-status-error dark:text-status-error"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-ui-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
