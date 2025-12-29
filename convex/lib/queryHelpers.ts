import type { FilterBuilder, PaginationOptions, PaginationResult } from "convex/server";
import type { QueryCtx } from "../_generated/server";
import type { SoftDeletable } from "./softDeleteHelpers";

/**
 * Standardized pagination helper that enforces soft-delete filtering
 *
 * Usage:
 * ```ts
 * const results = await fetchPaginatedQuery(ctx, {
 *   paginationOpts: args.paginationOpts,
 *   query: (db) => db.query("tableName").withIndex("by_index", q => q.eq("field", value))
 * });
 * ```
 */
export async function fetchPaginatedQuery<T>(
  ctx: QueryCtx,
  opts: {
    paginationOpts: PaginationOptions;
    // biome-ignore lint/suspicious/noExplicitAny: Query builder types are complex in Convex
    query: (db: QueryCtx["db"]) => any;
  },
): Promise<PaginationResult<T>> {
  return await opts
    .query(ctx.db)
    // Always filter out soft-deleted items
    .filter((q: FilterBuilder<SoftDeletable>) => q.neq(q.field("isDeleted"), true))
    .paginate(opts.paginationOpts);
}
