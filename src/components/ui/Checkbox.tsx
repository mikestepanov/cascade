import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";
import { Check } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Label text for the checkbox */
  label?: string;
  /** Description text below the label */
  description?: string;
}

/**
 * Checkbox component built on Radix UI for accessibility.
 *
 * @example
 * // Basic checkbox
 * <Checkbox />
 *
 * // With label
 * <Checkbox label="Accept terms" />
 *
 * // With label and description
 * <Checkbox
 *   label="Email notifications"
 *   description="Receive emails about your account"
 * />
 *
 * // Controlled
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 */
const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const hasLabel = !!(label || description);

    const checkboxElement = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 dark:data-[state=checked]:bg-brand-500 dark:data-[state=checked]:border-brand-500 data-[state=checked]:text-white",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}
        >
          <Check className="h-3 w-3" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!hasLabel) {
      return checkboxElement;
    }

    return (
      <Flex align="start" gap="md">
        {checkboxElement}
        <div className="grid gap-1 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-ui-text-primary cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          {description && <p className="text-sm text-ui-text-secondary">{description}</p>}
        </div>
      </Flex>
    );
  },
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
