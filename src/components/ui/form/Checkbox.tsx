import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Reusable checkbox component with consistent styling and dark mode support
 *
 * @example
 * ```tsx
 * <Checkbox
 *   label="Make public"
 *   checked={isPublic}
 *   onChange={(e) => setIsPublic(e.target.checked)}
 * />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "rounded border-gray-300 dark:border-gray-600",
              "text-blue-600 dark:text-blue-500",
              "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-white dark:bg-gray-800",
              error && "border-red-500 dark:border-red-400",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined
            }
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${checkboxId}-helper`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
