import { Flex } from "./Flex";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

export function LoadingSpinner({ size = "md", className = "", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <Flex direction="column" align="center" justify="center" gap="md">
      {/* biome-ignore lint/a11y/useSemanticElements: role="status" is correct for loading spinner */}
      <div
        className={`animate-spin rounded-full border-ui-text-primary dark:border-ui-text-primary-dark border-t-transparent ${sizeClasses[size]} ${className}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {message && (
        <p className="text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark">{message}</p>
      )}
    </Flex>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <Flex align="center" justify="center" className="absolute inset-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark bg-opacity-90 z-10 rounded-lg">
      <LoadingSpinner size="lg" message={message} />
    </Flex>
  );
}
