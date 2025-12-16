import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  remainingCount?: number;
  label?: string;
  className?: string;
}

/**
 * LoadMoreButton component for pagination
 *
 * @example
 * <LoadMoreButton
 *   onClick={loadMore}
 *   isLoading={isLoadingMore}
 *   remainingCount={47}
 * />
 */
export function LoadMoreButton({
  onClick,
  isLoading = false,
  remainingCount,
  label,
  className,
}: LoadMoreButtonProps) {
  const buttonText = React.useMemo(() => {
    if (label) return label;
    if (remainingCount !== undefined && remainingCount > 0) {
      return `Load ${remainingCount} more`;
    }
    return "Load more";
  }, [label, remainingCount]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      isLoading={isLoading}
      disabled={isLoading}
      className={cn("w-full text-ui-text-secondary", className)}
    >
      {buttonText}
    </Button>
  );
}
