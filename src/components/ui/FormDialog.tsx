import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Flex } from "./Flex";

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
      <Flex direction="column" gap="lg">
        {children}

        <Flex justify="end" gap="sm" className="pt-4 border-t border-ui-border-primary dark:border-ui-border-primary-dark">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : saveLabel}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
