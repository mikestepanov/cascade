/**
 * AIErrorFallback - Error boundary fallback for AI components
 */

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
    <div className="flex items-center justify-center h-full p-6 bg-white dark:bg-gray-900">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>

        {error && process.env.NODE_ENV === "development" && (
          <details className="text-left text-sm text-gray-500 dark:text-gray-500 mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
