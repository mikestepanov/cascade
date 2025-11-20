import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

/**
 * Reusable select component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Select
 *   label="Priority"
 *   options={[
 *     { value: "low", label: "Low" },
 *     { value: "high", label: "High" }
 *   ]}
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-3 py-2 border rounded-md text-sm",
            "bg-ui-bg-primary dark:bg-ui-bg-primary-dark",
            "text-ui-text-primary dark:text-ui-text-primary-dark",
            "focus:outline-none focus:ring-2 focus:ring-ui-border-focus dark:focus:ring-ui-border-focus-dark focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-ui-border-error dark:border-ui-border-error-dark" : "border-ui-border-primary dark:border-ui-border-primary-dark",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          {...props}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-status-error dark:text-status-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-ui-text-tertiary dark:text-ui-text-tertiary-dark">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
