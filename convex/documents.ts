import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
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
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get user's private documents
    const privateDocuments = await ctx.db
      .query("documents")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .filter((q) => q.eq(q.field("isPublic"), false))
      .order("desc")
      .collect();

    // Get all public documents
    const publicDocuments = await ctx.db
      .query("documents")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();

    // Combine and add creator info
    const allDocuments = [...privateDocuments, ...publicDocuments];

    return await Promise.all(
      allDocuments.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy);
        return {
          ...doc,
          creatorName: creator?.name || creator?.email || "Unknown",
          isOwner: doc.createdBy === userId,
        };
      }),
    );
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

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
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

      // Apply project filter
      if (args.projectId && doc.projectId !== args.projectId) {
        continue;
      }

      // Apply creator filter
      if (args.createdBy) {
        if (args.createdBy === "me" && doc.createdBy !== userId) {
          continue;
        } else if (args.createdBy !== "me" && doc.createdBy !== args.createdBy) {
          continue;
        }
      }

      // Apply public/private filter
      if (args.isPublic !== undefined && doc.isPublic !== args.isPublic) {
        continue;
      }

      // Apply date range filter (createdAt)
      if (args.dateFrom && doc.createdAt < args.dateFrom) {
        continue;
      }
      if (args.dateTo && doc.createdAt > args.dateTo) {
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
        const project = doc.projectId ? await ctx.db.get(doc.projectId) : null;

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
