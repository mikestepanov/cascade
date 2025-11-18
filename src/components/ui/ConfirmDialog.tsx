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
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
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
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">{variantIcons[variant]}</div>
              <div className="flex-1">
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
                >
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
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
