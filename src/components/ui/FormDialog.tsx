import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={size}>
      <div className="space-y-4">
        {children}

        <div className="flex justify-end gap-2 pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : saveLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
