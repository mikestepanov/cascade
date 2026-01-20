import { Component, type ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

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
    console.error("Uncaught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
          <div className="max-w-md w-full bg-ui-bg-primary shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="text-status-error text-6xl mb-4">⚠️</div>
              <Typography variant="h1" className="text-2xl font-bold text-ui-text-primary mb-2">
                Something went wrong
              </Typography>
              <Typography variant="muted" className="mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </Typography>
              {this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-ui-text-secondary hover:text-ui-text-primary">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs bg-ui-bg-tertiary p-3 rounded overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button onClick={() => window.location.reload()} size="lg">
                Reload Page
              </Button>
            </div>
          </div>
        </Flex>
      );
    }

    return this.props.children;
  }
}
