import type {
  FilterBuilder,
  GenericDocument,
  GenericTableIndexes,
  GenericTableSearchIndexes,
  GenericTableVectorIndexes,
  PaginationOptions,
  PaginationResult,
} from "convex/server";
import type { QueryCtx } from "../_generated/server";

// Helper to wrap T into a TableInfo structure for FilterBuilder
type TableInfoFor = {
  document: GenericDocument; // Keeping document as generic record
  fieldPaths: string;
  indexes: GenericTableIndexes;
  searchIndexes: GenericTableSearchIndexes;
  vectorIndexes: GenericTableVectorIndexes;
};

export async function fetchPaginatedQuery<T extends GenericDocument>(
  ctx: QueryCtx,
  opts: {
    paginationOpts: PaginationOptions;

    query: (db: QueryCtx["db"]) => unknown;
  },
): Promise<PaginationResult<T>> {
  // Cast through unknown as the query builder types are complex
  const queryResult = opts.query(ctx.db) as unknown as {
    filter: (fn: (q: FilterBuilder<TableInfoFor>) => unknown) => unknown;
  };
  return await (
    queryResult
      // Always filter out soft-deleted items
      .filter((q: FilterBuilder<TableInfoFor>) => q.neq(q.field("isDeleted"), true)) as unknown as {
      paginate: (opts: PaginationOptions) => Promise<PaginationResult<T>>;
    }
  ).paginate(opts.paginationOpts);
}
