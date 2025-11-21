import { handleKeyboardClick } from "@/lib/accessibility";

interface ModalBackdropProps {
  onClick: () => void;
  zIndex?: "z-30" | "z-40" | "z-50";
  animated?: boolean;
  className?: string;
}

/**
 * Reusable modal backdrop component with proper accessibility
 * Provides consistent backdrop behavior across all modals
 */
export function ModalBackdrop({
  onClick,
  zIndex = "z-40",
  animated = true,
  className = "",
}: ModalBackdropProps) {
  return (
    <button
      type="button"
      className={`fixed inset-0 bg-black bg-opacity-50 cursor-default ${zIndex} ${
        animated ? "animate-in fade-in duration-200" : ""
      } ${className}`.trim()}
      onClick={onClick}
      aria-label="Close modal"
    />
  );
}
