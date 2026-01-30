import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Flex } from "./Flex";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const variantIcons = {
    danger: "⚠️",
    warning: "❗",
    info: "ℹ️",
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-ui-bg border-ui-border">
        <AlertDialogHeader>
          <Flex align="start" gap="lg">
            <div className="text-4xl shrink-0">{variantIcons[variant]}</div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold text-ui-text">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-ui-text-secondary mt-2">
                {message}
              </AlertDialogDescription>
            </div>
          </Flex>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-ui-bg-secondary -mx-6 -mb-6 px-6 py-4 rounded-b-lg mt-4">
          <AlertDialogCancel
            disabled={isLoading}
            className="bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-bg-secondary"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "info"
                ? "bg-brand text-white hover:bg-brand-hover"
                : "bg-status-error text-white hover:bg-status-error/90",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
