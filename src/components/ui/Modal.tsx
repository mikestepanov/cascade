import type { ReactNode } from "react";
import { ModalBackdrop } from "./ModalBackdrop";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  fullScreenOnMobile?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  fullScreenOnMobile = false,
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <>
      {/* Backdrop */}
      <ModalBackdrop onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs stopPropagation to prevent backdrop clicks */}
        <div
          className={`bg-ui-bg-primary dark:bg-ui-bg-primary-dark ${
            fullScreenOnMobile
              ? "rounded-none sm:rounded-lg min-h-screen sm:min-h-0"
              : "rounded-lg m-4 sm:m-0"
          } shadow-xl w-full ${maxWidthClasses[maxWidth]} animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="sticky top-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark p-4 sm:p-6 flex items-center justify-between rounded-t-lg z-10">
              <h2
                id="modal-title"
                className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-ui-text-tertiary hover:text-ui-text-secondary dark:text-ui-text-tertiary-dark dark:hover:text-ui-text-secondary-dark p-1 rounded-lg hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors"
                aria-label="Close modal"
              >
                <svg
                  aria-hidden="true"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          <div className={title ? "" : "p-4 sm:p-6"}>{children}</div>
        </div>
      </div>
    </>
  );
}
