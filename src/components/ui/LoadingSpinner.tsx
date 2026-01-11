import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

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
      <output
        className={cn(
          "animate-spin rounded-full border-ui-text-primary dark:border-ui-text-primary-dark border-t-transparent",
          sizeClasses[size],
          className,
        )}
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </output>
      {message && (
        <Typography
          variant="small"
          className="text-ui-text-secondary dark:text-ui-text-secondary-dark"
        >
          {message}
        </Typography>
      )}
    </Flex>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-ui-bg-primary dark:bg-ui-bg-primary-dark bg-opacity-90 z-10 rounded-lg flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}
