/**
 * Plate Editor Instance Factory
 *
 * Creates and configures Plate editor instances with all plugins.
 * Used by the PlateEditor component.
 */

import type { Value } from "platejs";
import { initialValue, platePlugins } from "./plugins";

/**
 * Options for creating a Plate editor
 */
export interface CreatePlateEditorOptions {
  /** Initial document value (Slate nodes) */
  value?: Value;
  /** Unique ID for the editor instance */
  id?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

/**
 * Get the plugins array for usePlateEditor hook
 */
export function getEditorPlugins() {
  return platePlugins;
}

/**
 * Get initial value for a new document
 */
export function getInitialValue(): Value {
  return initialValue as Value;
}

/**
 * Serialize editor value to JSON string for storage
 */
export function serializeValue(value: Value): string {
  return JSON.stringify(value);
}

/**
 * Deserialize JSON string to editor value
 * Returns initial value if parsing fails
 */
export function deserializeValue(json: string | null | undefined): Value {
  if (!json) {
    return getInitialValue();
  }

  try {
    const parsed = JSON.parse(json) as Value;
    // Basic validation - must be an array with at least one element
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getInitialValue();
  } catch {
    return getInitialValue();
  }
}

/**
 * Check if a value is empty (only contains empty paragraph)
 */
export function isEmptyValue(value: Value): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    return true;
  }

  if (value.length > 1) {
    return false;
  }

  const firstNode = value[0];
  if (!firstNode || typeof firstNode !== "object") {
    return true;
  }

  // Check if it's an empty paragraph
  if ("type" in firstNode && firstNode.type === "p") {
    if ("children" in firstNode && Array.isArray(firstNode.children)) {
      const children = firstNode.children;
      if (children.length === 0) {
        return true;
      }
      if (children.length === 1) {
        const firstChild = children[0];
        if (
          firstChild &&
          typeof firstChild === "object" &&
          "text" in firstChild &&
          firstChild.text === ""
        ) {
          return true;
        }
      }
    }
  }

  return false;
}
