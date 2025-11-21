import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-ui-bg-secondary dark:bg-ui-bg-secondary-dark">
          <div className="max-w-md w-full bg-ui-bg-primary dark:bg-ui-bg-primary-dark shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="text-status-error dark:text-status-error-dark text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-ui-text-primary dark:text-ui-text-primary-dark mb-2">
                Something went wrong
              </h1>
              <p className="text-ui-text-secondary dark:text-ui-text-secondary-dark mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark p-3 rounded overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
