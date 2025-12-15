import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("documents", {
      title: args.title,
      isPublic: args.isPublic,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { documents: [], nextCursor: null, hasMore: false };
    }

    const limit = args.limit ?? 50;

    // Get user's private documents
    const privateDocuments = await ctx.db
      .query("documents")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .filter((q) => q.eq(q.field("isPublic"), false))
      .order("desc")
      .collect();

    // Get public documents (bounded - typically fewer)
    const publicDocuments = await ctx.db
      .query("documents")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();

    // Combine and deduplicate (private docs may also be in public if toggled)
    const seenIds = new Set<string>();
    const allDocuments = [...privateDocuments, ...publicDocuments].filter((doc) => {
      if (seenIds.has(doc._id)) return false;
      seenIds.add(doc._id);
      return true;
    });

    // Sort by updatedAt descending
    allDocuments.sort((a, b) => b.updatedAt - a.updatedAt);

    // Apply cursor-based pagination
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = allDocuments.findIndex((doc) => doc._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedDocs = allDocuments.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allDocuments.length;
    const nextCursor =
      hasMore && paginatedDocs.length > 0 ? paginatedDocs[paginatedDocs.length - 1]._id : null;

    // Batch fetch creators to avoid N+1
    const creatorIds = [...new Set(paginatedDocs.map((doc) => doc.createdBy))];
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)));
    const creatorMap = new Map(creatorIds.map((id, i) => [id, creators[i]]));

    const documents = paginatedDocs.map((doc) => {
      const creator = creatorMap.get(doc.createdBy);
      return {
        ...doc,
        creatorName: creator?.name || creator?.email || "Unknown",
        isOwner: doc.createdBy === userId,
      };
    });

    return { documents, nextCursor, hasMore };
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const document = await ctx.db.get(args.id);

    if (!document) {
      return null;
    }

    // Check if user can access this document
    if (!document.isPublic && document.createdBy !== userId) {
      throw new Error("Not authorized to access this document");
    }

    const creator = await ctx.db.get(document.createdBy);
    return {
      ...document,
      creatorName: creator?.name || creator?.email || "Unknown",
      isOwner: document.createdBy === userId,
    };
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("documents"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.createdBy !== userId) {
      throw new Error("Not authorized to edit this document");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const togglePublic = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.createdBy !== userId) {
      throw new Error("Not authorized to edit this document");
    }

    await ctx.db.patch(args.id, {
      isPublic: !document.isPublic,
      updatedAt: Date.now(),
    });
  },
});

export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.createdBy !== userId) {
      throw new Error("Not authorized to delete this document");
    }

    await ctx.db.delete(args.id);
  },
});

// Helper: Check if document matches search filters
function matchesDocumentFilters(
  doc: {
    isPublic: boolean;
    createdBy: Id<"users">;
    workspaceId?: Id<"workspaces">;
    createdAt: number;
  },
  filters: {
    workspaceId?: Id<"workspaces">;
    createdBy?: Id<"users"> | "me";
    isPublic?: boolean;
    dateFrom?: number;
    dateTo?: number;
  },
  userId: Id<"users">,
): boolean {
  // Apply project filter
  if (filters.workspaceId && doc.workspaceId !== filters.workspaceId) {
    return false;
  }

  // Apply creator filter
  if (filters.createdBy) {
    if (filters.createdBy === "me" && doc.createdBy !== userId) {
      return false;
    }
    if (filters.createdBy !== "me" && doc.createdBy !== filters.createdBy) {
      return false;
    }
  }

  // Apply public/private filter
  if (filters.isPublic !== undefined && doc.isPublic !== filters.isPublic) {
    return false;
  }

  // Apply date range filter
  if (filters.dateFrom && doc.createdAt < filters.dateFrom) {
    return false;
  }
  if (filters.dateTo && doc.createdAt > filters.dateTo) {
    return false;
  }

  return true;
}

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")),
    createdBy: v.optional(v.union(v.id("users"), v.literal("me"))),
    isPublic: v.optional(v.boolean()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { results: [], total: 0, hasMore: false };
    }

    if (!args.query.trim()) {
      return { results: [], total: 0, hasMore: false };
    }

    const results = await ctx.db
      .query("documents")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .collect();

    // Filter results based on access permissions and advanced filters
    const filtered = [];
    for (const doc of results) {
      // Check access permissions
      if (!doc.isPublic && doc.createdBy !== userId) {
        continue;
      }

      // Apply all search filters
      if (!matchesDocumentFilters(doc, args, userId)) {
        continue;
      }

      filtered.push(doc);
    }

    const total = filtered.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 20;

    // Apply pagination
    const paginatedResults = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Enrich with creator and project data
    const enrichedResults = await Promise.all(
      paginatedResults.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy);
        const project = doc.workspaceId ? await ctx.db.get(doc.workspaceId) : null;

        return {
          ...doc,
          creatorName: creator?.name || creator?.email || "Unknown",
          isOwner: doc.createdBy === userId,
          project: project
            ? {
                _id: project._id,
                name: project.name,
                key: project.key,
              }
            : null,
        };
      }),
    );

    return {
      results: enrichedResults,
      total,
      hasMore,
      offset,
      limit,
    };
  },
});
