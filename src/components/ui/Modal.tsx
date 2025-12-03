import type { ReactNode } from "react";
import { Button } from "./Button";
import { Flex } from "./Flex";
import { XIcon } from "./icons";
import { ModalBackdrop } from "./ModalBackdrop";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Simple string title - renders standard header with close button */
  title?: string;
  /** Custom header content - renders instead of title, you handle close button */
  header?: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  fullScreenOnMobile?: boolean;
  /** Additional className for the modal container */
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  header,
  children,
  maxWidth = "md",
  fullScreenOnMobile = false,
  className,
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

  const hasHeader = title || header;

  return (
    <>
      {/* Backdrop */}
      <ModalBackdrop onClick={onClose} />

      {/* Modal */}
      <Flex
        align="start"
        justify="center"
        className="fixed inset-0 sm:items-center z-50 p-0 sm:p-4 overflow-y-auto"
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
          } shadow-xl w-full ${maxWidthClasses[maxWidth]} animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200 ${className || ""}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Custom header takes precedence over title */}
          {header ? (
            <div className="sticky top-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark p-4 sm:p-6 rounded-t-lg z-10">
              {header}
            </div>
          ) : title ? (
            <Flex
              align="center"
              justify="between"
              className="sticky top-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark border-b border-ui-border-primary dark:border-ui-border-primary-dark p-4 sm:p-6 rounded-t-lg z-10"
            >
              <h2
                id="modal-title"
                className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark"
              >
                {title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 min-h-0"
              >
                <XIcon />
              </Button>
            </Flex>
          ) : null}
          <div className={hasHeader ? "" : "p-4 sm:p-6"}>{children}</div>
        </div>
      </Flex>
    </>
  );
}
