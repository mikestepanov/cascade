import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const toggleGroupVariants = cva(
  "inline-flex items-center justify-center rounded-lg bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark p-1",
  {
    variants: {
      size: {
        sm: "gap-0.5",
        md: "gap-1",
        lg: "gap-1.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-ui-bg-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-ui-bg-tertiary dark:hover:bg-ui-bg-tertiary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark data-[state=on]:bg-ui-bg-primary dark:data-[state=on]:bg-ui-bg-primary-dark data-[state=on]:text-ui-text-primary dark:data-[state=on]:text-ui-text-primary-dark data-[state=on]:shadow-sm",
        brand:
          "bg-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 data-[state=on]:bg-brand-600 data-[state=on]:text-white",
        danger:
          "bg-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-status-error-bg dark:hover:bg-status-error-bg-dark hover:text-status-error-text dark:hover:text-status-error-text-dark data-[state=on]:bg-status-error data-[state=on]:text-white",
        success:
          "bg-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-status-success-bg dark:hover:bg-status-success-bg-dark hover:text-status-success-text dark:hover:text-status-success-text-dark data-[state=on]:bg-status-success data-[state=on]:text-white",
        accent:
          "bg-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:bg-accent-100 dark:hover:bg-accent-900/30 hover:text-accent-700 dark:hover:text-accent-300 data-[state=on]:bg-accent-600 data-[state=on]:text-white",
        outline:
          "border border-ui-border-primary dark:border-ui-border-primary-dark bg-transparent hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark data-[state=on]:bg-ui-bg-secondary dark:data-[state=on]:bg-ui-bg-secondary-dark data-[state=on]:border-brand-500",
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

type ToggleGroupContextValue = VariantProps<typeof toggleGroupItemVariants>;

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  variant: "default",
  size: "md",
});

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupVariants> &
  VariantProps<typeof toggleGroupItemVariants> & {
    children?: React.ReactNode;
  };

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(toggleGroupVariants({ size, className }))}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

interface ToggleGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleGroupItemVariants> {}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleGroupItemVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleGroupItemVariants };
