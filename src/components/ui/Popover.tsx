import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { cn } from "@/lib/utils";

const PopoverRoot = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-lg border border-ui-border-primary dark:border-ui-border-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark p-4 text-ui-text-primary dark:text-ui-text-primary-dark shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export interface PopoverProps {
  /** Content to show in the popover */
  content: React.ReactNode;
  /** Element that triggers the popover */
  children: React.ReactNode;
  /** Side of the trigger to show popover */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment of the popover */
  align?: "start" | "center" | "end";
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Additional class for content */
  className?: string;
}

/**
 * Popover component for floating content panels.
 *
 * @example
 * // Basic popover
 * <Popover content={<div>Popover content</div>}>
 *   <Button>Click me</Button>
 * </Popover>
 *
 * // Controlled popover
 * <Popover
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   content={<div>Content</div>}
 * >
 *   <Button>Toggle</Button>
 * </Popover>
 */
function Popover({
  content,
  children,
  side = "bottom",
  align = "center",
  open,
  onOpenChange,
  className,
}: PopoverProps) {
  return (
    <PopoverRoot open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} align={align} className={className}>
        {content}
      </PopoverContent>
    </PopoverRoot>
  );
}

export { Popover, PopoverRoot, PopoverTrigger, PopoverContent, PopoverAnchor };
