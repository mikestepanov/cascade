import { Flex } from "@/components/ui/Flex";
import { Typography } from "./ui/Typography";

interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function SectionErrorFallback({ title, message, onRetry }: Props) {
  return (
    <Flex align="center" justify="center" className="h-full p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-status-error text-4xl mb-3">⚠️</div>
        <Typography variant="h2" className="text-xl font-semibold text-ui-text-primary mb-2">
          {title}
        </Typography>
        <Typography className="text-ui-text-secondary mb-4">
          {message ||
            "This section encountered an error. Try reloading or contact support if the problem persists."}
        </Typography>
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
    </Flex>
  );
}
