/**
 * Accessibility utilities for interactive elements
 */

/**
 * Handle keyboard events for clickable elements (Enter and Space keys)
 * @param handler The click handler function to call
 * @returns A keyboard event handler
 */
export function handleKeyboardClick(handler: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}

/**
 * Handle keyboard events with event parameter for clickable elements
 * @param handler The click handler function that accepts an event
 * @returns A keyboard event handler
 */
export function handleKeyboardClickWithEvent<T = Element>(
  handler: (e: React.MouseEvent<T> | React.KeyboardEvent<T>) => void,
) {
  return (e: React.KeyboardEvent<T>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler(e);
    }
  };
}
