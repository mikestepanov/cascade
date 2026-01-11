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
      <AlertDialogContent className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-ui-border-primary dark:border-ui-border-primary-dark">
        <AlertDialogHeader>
          <Flex align="start" gap="lg">
            <div className="text-4xl flex-shrink-0">{variantIcons[variant]}</div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark mt-2">
                {message}
              </AlertDialogDescription>
            </div>
          </Flex>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark -mx-6 -mb-6 px-6 py-4 rounded-b-lg mt-4">
          <AlertDialogCancel
            disabled={isLoading}
            className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark text-ui-text-primary dark:text-ui-text-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              variant === "info"
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-status-error text-white hover:bg-status-error/90",
            )}
          >
            {isLoading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
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
