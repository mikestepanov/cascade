/**
 * Array manipulation utilities
 */

/**
 * Toggle an item in an array (add if not present, remove if present)
 */
export function toggleInArray<T>(array: T[], item: T): T[] {
  return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
}

/**
 * Create a toggle handler for use in React state setters
 */
export function createToggleHandler<T>(
  setter: (fn: (prev: T[]) => T[]) => void,
): (item: T) => void {
  return (item: T) => {
    setter((prev) => toggleInArray(prev, item));
  };
}

/**
 * Remove duplicates from an array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Check if two arrays have the same elements (order-independent)
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Split array into chunks of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
