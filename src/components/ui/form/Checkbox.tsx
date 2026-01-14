import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Flex } from "../Flex";
import { Typography } from "../Typography";

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
        <Flex align="center" gap="sm">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "rounded border-ui-border-primary dark:border-ui-border-primary-dark",
              "text-brand-600 dark:text-brand-500",
              "focus:ring-2 focus:ring-ui-border-focus dark:focus:ring-ui-border-focus-dark",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-ui-bg-primary dark:bg-ui-bg-primary-dark",
              error && "border-ui-border-error dark:border-ui-border-error-dark",
              className,
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
              className="text-sm text-ui-text-primary cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </Flex>
        {error && (
          <Typography
            variant="small"
            id={`${checkboxId}-error`}
            className="mt-1 text-status-error dark:text-status-error"
          >
            {error}
          </Typography>
        )}
        {helperText && !error && (
          <Typography variant="muted" id={`${checkboxId}-helper`} className="mt-1 text-xs">
            {helperText}
          </Typography>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
