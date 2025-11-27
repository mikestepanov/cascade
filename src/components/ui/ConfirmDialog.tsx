import { Button } from "./Button";
import { Flex } from "./Flex";
import { ModalBackdrop } from "./ModalBackdrop";

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
  if (!isOpen) return null;

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
    <>
      {/* Backdrop */}
      <ModalBackdrop onClick={onClose} zIndex="z-50" />

      {/* Dialog */}
      <Flex
        align="center"
        justify="center"
        className="fixed inset-0 z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs stopPropagation to prevent backdrop clicks */}
        <div
          className="bg-ui-bg-primary dark:bg-ui-bg-primary-dark rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <Flex align="start" gap="lg">
              <div className="text-4xl flex-shrink-0">{variantIcons[variant]}</div>
              <div className="flex-1">
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2"
                >
                  {title}
                </h3>
                <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">
                  {message}
                </p>
              </div>
            </Flex>
          </div>

          <Flex
            gap="md"
            justify="end"
            className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark px-6 py-4 rounded-b-lg"
          >
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "info" ? "primary" : "danger"}
              onClick={handleConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </Flex>
        </div>
      </Flex>
    </>
  );
}
