/**
 * AI Queries - Fetch AI chat history and context
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { type QueryCtx, query } from "../_generated/server";
import { batchFetchUsers, getUserName } from "../lib/batchHelpers";
import type { AIProvider } from "./config";

type AIOperation = "chat" | "suggestion" | "automation" | "analysis";

/**
 * Get all AI chats for current user
 */
export const getUserChats = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx: QueryCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const chatsQuery = ctx.db.query("aiChats").withIndex("by_user", (q) => q.eq("userId", userId));

    const chats = await chatsQuery.collect();

    // Filter by project if specified
    const filtered = args.projectId
      ? chats.filter((chat) => chat.projectId === args.projectId)
      : chats;

    // Sort by most recent
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get messages for a specific chat
 */
export const getChatMessages = query({
  args: {
    chatId: v.id("aiChats"),
  },
  handler: async (ctx: QueryCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify user owns this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId))
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Get project context for AI
 */
export const getProjectContext = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx: QueryCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check access
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", userId))
      .first();

    if (!member && project.createdBy !== userId && !project.isPublic) {
      throw new Error("Access denied");
    }

    // Get active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Get issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Calculate stats
    const stats = {
      totalIssues: issues.length,
      inProgress: issues.filter((i) => {
        const state = project.workflowStates.find((s) => s.id === i.status);
        return state?.category === "inprogress";
      }).length,
      completed: issues.filter((i) => {
        const state = project.workflowStates.find((s) => s.id === i.status);
        return state?.category === "done";
      }).length,
      todo: issues.filter((i) => {
        const state = project.workflowStates.find((s) => s.id === i.status);
        return state?.category === "todo";
      }).length,
    };

    // Get project members with details
    const memberRecords = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Batch fetch users to avoid N+1 queries
    const userIds = memberRecords.map((m) => m.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    const members = memberRecords.map((m) => ({
      id: m.userId,
      name: getUserName(userMap.get(m.userId)),
      role: m.role,
    }));

    // Get labels
    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return {
      project: {
        id: project._id,
        name: project.name,
        key: project.key,
        description: project.description,
      },
      activeSprint: activeSprint
        ? {
            id: activeSprint._id,
            name: activeSprint.name,
            goal: activeSprint.goal,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
          }
        : null,
      stats,
      members,
      labels: labels.map((l) => ({ name: l.name, color: l.color })),
      issues: issues.map((i) => ({
        key: i.key,
        title: i.title,
        type: i.type,
        status: i.status,
        priority: i.priority,
      })),
    };
  },
});

/**
 * Get AI suggestions for a project
 */
export const getProjectSuggestions = query({
  args: {
    projectId: v.id("projects"),
    suggestionType: v.optional(
      v.union(
        v.literal("issue_description"),
        v.literal("issue_priority"),
        v.literal("issue_labels"),
        v.literal("issue_assignee"),
        v.literal("sprint_planning"),
        v.literal("risk_detection"),
        v.literal("insight"),
      ),
    ),
    includeResponded: v.optional(v.boolean()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const query = ctx.db
      .query("aiSuggestions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    const suggestions = await query.collect();

    // Filter by type if specified
    let filtered = args.suggestionType
      ? suggestions.filter((s) => s.suggestionType === args.suggestionType)
      : suggestions;

    // Filter out responded suggestions unless requested
    if (!args.includeResponded) {
      filtered = filtered.filter((s) => !(s.accepted || s.dismissed));
    }

    // Sort by most recent
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get AI usage statistics
 */
export const getUsageStats = query({
  args: {
    projectId: v.optional(v.id("projects")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Query usage records
    const usageQuery = ctx.db.query("aiUsage").withIndex("by_user", (q) => q.eq("userId", userId));

    const usage = await usageQuery.collect();

    // Filter by project and date range
    let filtered = usage;
    if (args.projectId) {
      filtered = filtered.filter((u) => u.projectId === args.projectId);
    }
    if (args.startDate !== undefined) {
      const startDate = args.startDate;
      filtered = filtered.filter((u) => u.createdAt >= startDate);
    }
    if (args.endDate !== undefined) {
      const endDate = args.endDate;
      filtered = filtered.filter((u) => u.createdAt <= endDate);
    }

    // Calculate aggregates
    const totalTokens = filtered.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = filtered.reduce((sum, u) => sum + (u.estimatedCost || 0), 0);
    const avgResponseTime =
      filtered.length > 0
        ? filtered.reduce((sum, u) => sum + u.responseTime, 0) / filtered.length
        : 0;

    const byProvider = filtered.reduce<Record<AIProvider, number>>(
      (acc, u) => {
        if (u.provider === "anthropic") {
          acc[u.provider] = (acc[u.provider] || 0) + u.totalTokens;
        }
        return acc;
      },
      { anthropic: 0 },
    );

    const byOperation = filtered.reduce<Record<AIOperation, number>>(
      (acc, u) => {
        if (
          u.operation === "chat" ||
          u.operation === "suggestion" ||
          u.operation === "automation" ||
          u.operation === "analysis"
        ) {
          acc[u.operation] = (acc[u.operation] || 0) + 1;
        }
        return acc;
      },
      { chat: 0, suggestion: 0, automation: 0, analysis: 0 },
    );

    return {
      totalRequests: filtered.length,
      totalTokens,
      totalCost, // in cents
      avgResponseTime, // in ms
      byProvider,
      byOperation,
      successRate:
        filtered.length > 0
          ? (filtered.filter((u) => u.success).length / filtered.length) * 100
          : 0,
    };
  },
});
