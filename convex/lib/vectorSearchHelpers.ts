/**
 * Vector Search Type Helpers
 *
 * Provides type-safe utilities for working with Convex vector search results
 */

import type { Id, TableNames } from "../_generated/dataModel";

/**
 * Type for vector search results
 *
 * Convex vector search returns results with _id and _score, but the _id type
 * is generic at runtime and needs to be cast to the specific table ID type.
 */
export interface VectorSearchResult<TableName extends TableNames> {
  _id: Id<TableName>;
  _score: number;
}

/**
 * Type-safe helper to extract vector search results
 *
 * This helper provides a safe way to work with vector search results
 * where the _id type needs to be cast to a specific table.
 */
export function asVectorResults<T extends TableNames>(
  results: Array<{ _id: unknown; _score: number }>,
): Array<VectorSearchResult<T>> {
  return results as Array<VectorSearchResult<T>>;
}
