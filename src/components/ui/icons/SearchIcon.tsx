import { cn } from "@/lib/utils";

interface SearchIconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

/**
 * Search icon component
 * Used in search inputs and search-related UI elements
 */
export function SearchIcon({
  className = "w-5 h-5",
  "aria-hidden": ariaHidden = true,
}: SearchIconProps) {
  return (
    <svg
      aria-hidden={ariaHidden}
      className={cn(className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <title>Search</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
