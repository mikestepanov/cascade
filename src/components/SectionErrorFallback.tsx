interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function SectionErrorFallback({ title, message, onRetry }: Props) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-status-error dark:text-status-error-dark text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-semibold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
          {title}
        </h2>
        <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-4">
          {message ||
            "This section encountered an error. Try reloading or contact support if the problem persists."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
