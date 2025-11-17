import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for keyboard navigation in lists
 * Handles arrow keys, Enter, and Escape
 */
export function useListNavigation<T>({
  items,
  onSelect,
  enabled = true,
  loop = true,
}: {
  items: T[];
  onSelect: (item: T, index: number) => void;
  enabled?: boolean;
  loop?: boolean; // Whether to loop from last to first
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [items]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || items.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => {
            if (prev < items.length - 1) {
              return prev + 1;
            }
            return loop ? 0 : prev;
          });
          break;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => {
            if (prev > 0) {
              return prev - 1;
            }
            if (prev === -1 && items.length > 0) {
              return items.length - 1;
            }
            return loop ? items.length - 1 : prev;
          });
          break;

        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            event.preventDefault();
            onSelect(items[selectedIndex], selectedIndex);
          }
          break;

        case "Escape":
          event.preventDefault();
          setSelectedIndex(-1);
          break;

        case "Home":
          event.preventDefault();
          setSelectedIndex(0);
          break;

        case "End":
          event.preventDefault();
          setSelectedIndex(items.length - 1);
          break;
      }
    },
    [enabled, items, selectedIndex, onSelect, loop],
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-list-index="${selectedIndex}"]`,
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    listRef,
    getItemProps: (index: number) => ({
      "data-list-index": index,
      className: selectedIndex === index ? "ring-2 ring-primary" : "",
      onMouseEnter: () => setSelectedIndex(index),
    }),
  };
}
