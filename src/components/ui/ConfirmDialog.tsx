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

  const variantStyles = {
    danger: "bg-status-error hover:bg-status-error/90 focus:ring-status-error",
    warning: "bg-status-warning hover:bg-status-warning/90 focus:ring-status-warning",
    info: "bg-brand-600 hover:bg-brand-700 focus:ring-brand-500",
  };

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
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
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
            <div className="flex items-start gap-4">
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
            </div>
          </div>

          <div className="bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark px-6 py-4 flex gap-3 justify-end rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark bg-ui-bg-primary dark:bg-ui-bg-primary-dark border border-ui-border-primary dark:border-ui-border-primary-dark rounded-lg hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark disabled:opacity-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
