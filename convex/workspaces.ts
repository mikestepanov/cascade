/**
 * Workspaces - Department-level organization
 *
 * Workspaces sit above teams in the hierarchy:
 * organization → Workspaces (departments) → Teams → Projects → Issues
 */

import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { notDeleted } from "./lib/softDeleteHelpers";
import { isOrganizationAdmin } from "./organizations";

/**
 * Create a new workspace (department)
 * Only organization admins can create workspaces
 */
export const create = authenticatedMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Check if user is organization admin
    const isAdmin = await isOrganizationAdmin(ctx, args.organizationId, ctx.userId);
    if (!isAdmin) throw new Error("Only organization admins can create workspaces");

    // Check if slug is unique within organization
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug),
      )
      .first();

    if (existing) {
      throw new Error("A workspace with this slug already exists");
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      organizationId: args.organizationId,
      createdBy: ctx.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return workspaceId;
  },
});

/**
 * List all workspaces for a organization
 */
export const list = authenticatedQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return workspaces;
  },
});

/**
 * Get a single workspace by ID
 */
export const get = authenticatedQuery({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw new Error("Workspace not found");

    return workspace;
  },
});

/**
 * Get workspace by slug
 */
export const getBySlug = authenticatedQuery({
  args: {
    organizationId: v.id("organizations"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug),
      )
      .first();

    if (!workspace) throw new Error("Workspace not found");

    return workspace;
  },
});

/**
 * Update workspace
 */
export const update = authenticatedMutation({
  args: {
    id: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultProjectVisibility: v.optional(v.boolean()),
        allowExternalSharing: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw new Error("Workspace not found");

    // Check permissions: Only organization admins can update workspaces
    const isAdmin = await isOrganizationAdmin(ctx, workspace.organizationId, ctx.userId);
    if (!isAdmin) {
      throw new Error("Only organization admins can perform this action");
    }

    await ctx.db.patch(args.id, {
      ...Object.fromEntries(
        Object.entries(args).filter(([key, value]) => key !== "id" && value !== undefined),
      ),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Delete workspace
 * WARNING: This will orphan all teams and projects in this workspace
 */
export const remove = authenticatedMutation({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.id);
    if (!workspace) throw new Error("Workspace not found");

    // Check permissions (workspace admin or organization admin)
    const isCreator = workspace.createdBy === ctx.userId;
    const isOrgAdmin = await isOrganizationAdmin(ctx, workspace.organizationId, ctx.userId);

    if (!(isCreator || isOrgAdmin)) {
      throw new Error("Only workspace admins or organization admins can delete workspaces");
    }

    // Check if workspace has teams or projects
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .first();

    if (teams) {
      throw new Error("Cannot delete workspace with teams. Please delete or move teams first.");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .filter(notDeleted)
      .first();

    if (projects) {
      throw new Error(
        "Cannot delete workspace with projects. Please delete or move projects first.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Get workspace stats (teams, projects count)
 */
export const getStats = authenticatedQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter(notDeleted)
      .collect();

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter(notDeleted)
      .collect();

    return {
      teamsCount: teams.length,
      projectsCount: projects.length,
    };
  },
});
