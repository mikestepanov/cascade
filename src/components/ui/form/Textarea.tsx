import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Reusable textarea component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   rows={4}
 *   placeholder="Enter description"
 *   error={errors.description}
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-3 py-2 border rounded-md text-sm resize-none",
            "bg-ui-bg-primary dark:bg-ui-bg-primary-dark",
            "text-ui-text-primary dark:text-ui-text-primary-dark",
            "placeholder-ui-text-tertiary dark:placeholder-ui-text-tertiary-dark",
            "focus:outline-none focus:ring-2 focus:ring-ui-border-focus dark:focus:ring-ui-border-focus-dark focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-ui-border-error dark:border-ui-border-error-dark" : "border-ui-border-primary dark:border-ui-border-primary-dark",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-status-error dark:text-status-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="mt-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
