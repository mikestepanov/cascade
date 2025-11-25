/**
 * AIErrorFallback - Error boundary fallback for AI components
 */

import { Flex } from "../ui/Flex";

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
    <Flex
      align="center"
      justify="center"
      className="h-full p-6 bg-ui-bg-primary dark:bg-ui-bg-primary-dark"
    >
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
          {title}
        </h3>
        <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">{message}</p>

        {error && process.env.NODE_ENV === "development" && (
          <details className="text-left text-sm text-ui-text-tertiary dark:text-ui-text-tertiary-dark mb-4 p-3 bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark rounded">
            <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
            <pre className="whitespace-pre-wrap overflow-auto max-h-32 text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </Flex>
  );
}
