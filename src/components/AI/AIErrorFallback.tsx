/**
 * AIErrorFallback - Error boundary fallback for AI components
 */

import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

export interface AIErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function AIErrorFallback({
  error,
  onRetry,
  title = "AI Assistant Error",
  message = "Something went wrong with the AI assistant. Please try again.",
}: AIErrorFallbackProps) {
  return (
    <Flex align="center" justify="center" className="h-full p-6 bg-ui-bg-primary">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-ui-text-primary mb-2">{title}</h3>
        <Typography variant="p" className="text-ui-text-secondary mb-4">
          {message}
        </Typography>

        {error && process.env.NODE_ENV === "development" && (
          <details className="text-left text-sm text-ui-text-tertiary mb-4 p-3 bg-ui-bg-secondary rounded">
            <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
            <pre className="whitespace-pre-wrap overflow-auto max-h-32 text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </Flex>
  );
}
