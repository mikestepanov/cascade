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
  document: Record<string, unknown>; // Keeping document as generic record
  fieldPaths: string;
  indexes: GenericTableIndexes;
  searchIndexes: GenericTableSearchIndexes;
  vectorIndexes: GenericTableVectorIndexes;
};

export async function fetchPaginatedQuery<T extends Record<string, unknown>>(
  ctx: QueryCtx,
  opts: {
    paginationOpts: PaginationOptions;

    query: (db: QueryCtx["db"]) => unknown;
  },
): Promise<PaginationResult<T>> {
  return await opts
    .query(ctx.db)
    // Always filter out soft-deleted items
    .filter((q: FilterBuilder<TableInfoFor>) => q.neq(q.field("isDeleted"), true))
    .paginate(opts.paginationOpts);
}
