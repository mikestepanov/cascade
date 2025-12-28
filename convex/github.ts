import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { notDeleted } from "./lib/softDeleteHelpers";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Connect GitHub account (OAuth callback)
export const connectGitHub = mutation({
  args: {
    githubUserId: v.string(),
    githubUsername: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if connection already exists
    const existing = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        githubUserId: args.githubUserId,
        githubUsername: args.githubUsername,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("githubConnections", {
      userId,
      githubUserId: args.githubUserId,
      githubUsername: args.githubUsername,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get GitHub connection for current user
export const getConnection = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Disconnect GitHub account
export const disconnectGitHub = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

// Link a GitHub repository to a project
export const linkRepository = mutation({
  args: {
    projectId: v.id("projects"),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.string(),
    syncPRs: v.optional(v.boolean()),
    syncIssues: v.optional(v.boolean()),
    autoLinkCommits: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user has access to project
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check permission (at least editor)
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace_user", (q) => q.eq("projectId", args.projectId).eq("userId", userId))
      .filter(notDeleted)      .first();

    if (!member && project.createdBy !== userId) {
      throw new Error("You don't have permission to link repositories to this project");
    }

    if (member && member.role === "viewer") {
      throw new Error("Viewers cannot link repositories");
    }

    // Check if repo already linked
    const repoFullName = `${args.repoOwner}/${args.repoName}`;
    const existing = await ctx.db
      .query("githubRepositories")
      .withIndex("by_repo_full_name", (q) => q.eq("repoFullName", repoFullName))
      .first();

    if (existing) {
      throw new Error("This repository is already linked to a project");
    }

    const now = Date.now();

    return await ctx.db.insert("githubRepositories", {
      projectId: args.projectId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      repoFullName,
      repoId: args.repoId,
      syncPRs: args.syncPRs ?? true,
      syncIssues: args.syncIssues ?? false,
      autoLinkCommits: args.autoLinkCommits ?? true,
      linkedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Unlink repository from project
export const unlinkRepository = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw new Error("Repository not found");

    const project = await ctx.db.get(repo.projectId);
    if (!project) throw new Error("Project not found");

    // Check permission (admin only)
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace_user", (q) => q.eq("projectId", repo.projectId).eq("userId", userId))
      .filter(notDeleted)      .first();

    const isAdmin = project.createdBy === userId || member?.role === "admin";
    if (!isAdmin) {
      throw new Error("Only admins can unlink repositories");
    }

    await ctx.db.delete(args.repositoryId);
  },
});

// List repositories linked to a project
export const listRepositories = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify access to project
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    if (!project.isPublic) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", userId),
        )
        .filter(notDeleted)        .first();

      if (!member && project.createdBy !== userId) {
        return [];
      }
    }

    return await ctx.db
      .query("githubRepositories")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)      .collect();
  },
});

// Create/update a pull request (called from webhook)
export const upsertPullRequest = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
    prNumber: v.number(),
    prId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    state: v.union(v.literal("open"), v.literal("closed"), v.literal("merged")),
    mergedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
    checksStatus: v.optional(
      v.union(v.literal("pending"), v.literal("success"), v.literal("failure")),
    ),
    issueKey: v.optional(v.string()), // e.g., "PROJ-123"
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw new Error("Repository not found");

    const now = Date.now();

    // Try to link to issue if issueKey provided
    let issueId: Id<"issues"> | undefined;
    if (args.issueKey) {
      const issue = await ctx.db
        .query("issues")
        .withIndex("by_workspace", (q) => q.eq("projectId", repo.projectId))
        .filter((q) => q.eq(q.field("key"), args.issueKey))
        .filter(notDeleted)        .first();

      if (issue) {
        issueId = issue._id;
      }
    }

    // Check if PR already exists
    const existing = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository_pr_number", (q) =>
        q.eq("repositoryId", args.repositoryId).eq("prNumber", args.prNumber),
      )
      .first();

    if (existing) {
      // Update existing PR
      await ctx.db.patch(existing._id, {
        title: args.title,
        body: args.body,
        state: args.state,
        mergedAt: args.mergedAt,
        closedAt: args.closedAt,
        checksStatus: args.checksStatus,
        issueId,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new PR
    return await ctx.db.insert("githubPullRequests", {
      issueId,
      projectId: repo.projectId,
      repositoryId: args.repositoryId,
      prNumber: args.prNumber,
      prId: args.prId,
      title: args.title,
      body: args.body,
      state: args.state,
      mergedAt: args.mergedAt,
      closedAt: args.closedAt,
      authorUsername: args.authorUsername,
      authorAvatarUrl: args.authorAvatarUrl,
      htmlUrl: args.htmlUrl,
      checksStatus: args.checksStatus,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Link PR to issue manually
export const linkPRToIssue = mutation({
  args: {
    prId: v.id("githubPullRequests"),
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pr = await ctx.db.get(args.prId);
    if (!pr) throw new Error("Pull request not found");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found");

    // Verify project match
    if (!issue.projectId) throw new Error("Issue has no project");
    if (pr.projectId !== issue.projectId) {
      throw new Error("PR and issue must be in the same project");
    }

    await ctx.db.patch(args.prId, {
      issueId: args.issueId,
      updatedAt: Date.now(),
    });
  },
});

// Get PRs for an issue
export const getPullRequests = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const issue = await ctx.db.get(args.issueId);
    if (!issue) return [];

    // Check access
    if (!issue.projectId) return [];
    const project = await ctx.db.get(issue.projectId);
    if (!project) return [];

    if (!project.isPublic) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("projectId", issue.projectId as Id<"projects">).eq("userId", userId),
        )
        .filter(notDeleted)        .first();

      if (!member && project.createdBy !== userId) {
        return [];
      }
    }

    return await ctx.db
      .query("githubPullRequests")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .filter(notDeleted)      .collect();
  },
});

// Create/update a commit (called from webhook or manual sync)
export const upsertCommit = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
    sha: v.string(),
    message: v.string(),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
    committedAt: v.number(),
    issueKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) throw new Error("Repository not found");

    const now = Date.now();

    // Try to link to issue if issueKey provided
    let issueId: Id<"issues"> | undefined;
    if (args.issueKey) {
      const issue = await ctx.db
        .query("issues")
        .withIndex("by_workspace", (q) => q.eq("projectId", repo.projectId))
        .filter((q) => q.eq(q.field("key"), args.issueKey))
        .filter(notDeleted)        .first();

      if (issue) {
        issueId = issue._id;
      }
    }

    // Check if commit already exists
    const existing = await ctx.db
      .query("githubCommits")
      .withIndex("by_sha", (q) => q.eq("sha", args.sha))
      .first();

    if (existing) {
      // Update if issue linking changed
      if (issueId && existing.issueId !== issueId) {
        await ctx.db.patch(existing._id, { issueId });
      }
      return existing._id;
    }

    // Create new commit
    return await ctx.db.insert("githubCommits", {
      issueId,
      projectId: repo.projectId,
      repositoryId: args.repositoryId,
      sha: args.sha,
      message: args.message,
      authorUsername: args.authorUsername,
      authorAvatarUrl: args.authorAvatarUrl,
      htmlUrl: args.htmlUrl,
      committedAt: args.committedAt,
      createdAt: now,
    });
  },
});

// Get commits for an issue
export const getCommits = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const issue = await ctx.db.get(args.issueId);
    if (!issue) return [];

    // Check access
    if (!issue.projectId) return [];
    const project = await ctx.db.get(issue.projectId);
    if (!project) return [];

    if (!project.isPublic) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("projectId", issue.projectId as Id<"projects">).eq("userId", userId),
        )
        .filter(notDeleted)        .first();

      if (!member && project.createdBy !== userId) {
        return [];
      }
    }

    return await ctx.db
      .query("githubCommits")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .order("desc")
      .filter(notDeleted)      .collect();
  },
});
