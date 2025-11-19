import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse bg-gray-200 dark:bg-gray-700 rounded", className)} />;
}

/**
 * Skeleton for card-shaped content with optional padding
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4",
        className,
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton for text lines with varying widths
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`skeleton-text-${i}`}
          className={cn("h-4", i === lines - 1 ? "w-4/5" : i % 2 === 0 ? "w-full" : "w-11/12")}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for circular avatars
 */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />;
}

/**
 * Skeleton for table rows
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`skeleton-row-${i}`} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for list items (issues, documents, etc.)
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={`skeleton-item-${i}`} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start gap-3">
            <SkeletonAvatar size="sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for stat cards (Dashboard stats)
 */
export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="text-center space-y-3">
        <Skeleton className="h-3 w-24 mx-auto" />
        <Skeleton className="h-10 w-16 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Skeleton for kanban cards
 */
export function SkeletonKanbanCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center gap-2 pt-2">
        <SkeletonAvatar size="sm" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton for project cards
 */
export function SkeletonProjectCard() {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}
