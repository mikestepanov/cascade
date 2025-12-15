import { cn } from "@/lib/utils";

export interface PaginationInfoProps {
  loaded: number;
  total: number;
  itemName?: string;
  className?: string;
}

/**
 * PaginationInfo component showing "Showing X of Y items"
 *
 * @example
 * <PaginationInfo loaded={50} total={150} itemName="issues" />
 * // Renders: "Showing 50 of 150 issues"
 */
export function PaginationInfo({
  loaded,
  total,
  itemName = "items",
  className,
}: PaginationInfoProps) {
  if (loaded === total) {
    return (
      <span className={cn("text-sm text-ui-text-tertiary", className)}>
        {total} {itemName}
      </span>
    );
  }

  return (
    <span className={cn("text-sm text-ui-text-tertiary", className)}>
      Showing {loaded} of {total} {itemName}
    </span>
  );
}
