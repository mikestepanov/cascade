import type {
  FilterBuilder,
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  PaginationOptions,
  PaginationResult,
} from "convex/server";
import type { QueryCtx } from "../_generated/server";

// Helper to wrap T into a TableInfo structure for FilterBuilder
type TableInfoFor = {
  // biome-ignore lint/suspicious/noExplicitAny: FilterBuilder needs a permissive type to allow filtering on arbitrary fields
  document: any; // Keeping document as any for now to avoid 'unknown' issues, or can try T
  fieldPaths: string;
  indexes: GenericTableIndexes;
  searchIndexes: GenericTableSearchIndexes;
  vectorIndexes: GenericTableVectorIndexes;
};

export async function fetchPaginatedQuery<T extends Record<string, unknown>>(
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
    .filter((q: FilterBuilder<TableInfoFor>) => q.neq(q.field("isDeleted"), true))
    .paginate(opts.paginationOpts);
}
