import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog";
import { Flex } from "./Flex";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void | Promise<void>;
  title: string;
  children: ReactNode;
  saveLabel?: string;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Reusable form dialog component
 * Standardizes the pattern used across all Manager components
 */
export function FormDialog({
  open,
  onOpenChange,
  onSave,
  title,
  children,
  saveLabel = "Save",
  isLoading = false,
  size = "md",
}: FormDialogProps) {
  const handleSave = async () => {
    await onSave();
  };

  // Map size prop to Tailwind classes
  const sizeClassMap = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClassMap[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Flex direction="column" gap="lg">
          {children}
        </Flex>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
