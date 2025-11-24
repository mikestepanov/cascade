import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanAccessProject } from "./projectAccess";

const filtersValidator = v.object({
  type: v.optional(
    v.array(v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic"))),
  ),
  status: v.optional(v.array(v.string())),
  priority: v.optional(
    v.array(
      v.union(
        v.literal("lowest"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("highest"),
      ),
    ),
  ),
  assigneeId: v.optional(v.array(v.id("users"))),
  labels: v.optional(v.array(v.string())),
  sprintId: v.optional(v.id("sprints")),
  epicId: v.optional(v.id("issues")),
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    filters: filtersValidator,
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertCanAccessProject(ctx, args.projectId, userId);

    const now = Date.now();
    return await ctx.db.insert("savedFilters", {
      projectId: args.projectId,
      userId,
      name: args.name,
      filters: args.filters,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    try {
      await assertCanAccessProject(ctx, args.projectId, userId);
    } catch {
      return [];
    }

    // Get user's own filters
    const myFilters = await ctx.db
      .query("savedFilters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Get public filters from other users
    const publicFilters = await ctx.db
      .query("savedFilters")
      .withIndex("by_project_public", (q) => q.eq("projectId", args.projectId).eq("isPublic", true))
      .filter((q) => q.neq(q.field("userId"), userId))
      .collect();

    // Combine and add user info
    const all = [...myFilters, ...publicFilters];
    return await Promise.all(
      all.map(async (filter) => {
        const creator = await ctx.db.get(filter.userId);
        return {
          ...filter,
          creatorName: creator?.name || "Unknown",
          isOwner: filter.userId === userId,
        };
      }),
    );
  },
});

export const update = mutation({
  args: {
    id: v.id("savedFilters"),
    name: v.optional(v.string()),
    filters: v.optional(filtersValidator),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const filter = await ctx.db.get(args.id);
    if (!filter) {
      throw new Error("Filter not found");
    }

    if (filter.userId !== userId) {
      throw new Error("Not authorized");
    }

    const updates: Partial<typeof filter> & { updatedAt: number } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.filters !== undefined) updates.filters = args.filters;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("savedFilters"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const filter = await ctx.db.get(args.id);
    if (!filter) {
      throw new Error("Filter not found");
    }

    if (filter.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
