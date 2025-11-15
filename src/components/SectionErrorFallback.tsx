interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function SectionErrorFallback({ title, message, onRetry }: Props) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">
          {message ||
            "This section encountered an error. Try reloading or contact support if the problem persists."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
