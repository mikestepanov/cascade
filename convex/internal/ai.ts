// @ts-nocheck
/**
 * Internal AI Functions
 *
 * Extracted to separate file to avoid circular type references.
 * These internal functions are called by public actions in convex/ai.ts
 *
 * Note: Type checking disabled due to TypeScript limitation with deep type instantiation
 * when using Convex's internal function builders. This is a known limitation when combining
 * Convex with AI SDK packages. See convex/ai.ts for more details.
 */

import { openai } from "@ai-sdk/openai";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";

/**
 * Generate embedding for text using OpenAI
 */
export const generateEmbedding = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    // Use OpenAI's text-embedding-3-small model (1536 dimensions)
    const model = openai.embedding("text-embedding-3-small");

    const { embeddings } = await model.doEmbed({
      values: [args.text],
    });

    return embeddings[0]; // Return first (and only) embedding
  },
});

/**
 * Internal query to fetch issue data
 */
export const getIssueData = internalQuery({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.issueId);
  },
});

/**
 * Store embedding in issue document
 */
export const storeIssueEmbedding = internalMutation({
  args: {
    issueId: v.id("issues"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.issueId, {
      embedding: args.embedding,
    });
  },
});

/**
 * Create new AI chat
 */
export const createChat = internalMutation({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by subject ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("aiChats", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Add message to chat
 */
export const addMessage = internalMutation({
  args: {
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      modelUsed: args.modelUsed,
      tokensUsed: args.tokensUsed,
      createdAt: Date.now(),
    });

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get project context for AI
 */
export const getProjectContext = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return "";

    // Get active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Get issues summary
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(100); // Limit for context

    const issuesByStatus = issues.reduce(
      (acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return `
Project: ${project.name} (${project.key})
Description: ${project.description || "No description"}
Active Sprint: ${activeSprint ? activeSprint.name : "None"}
Total Issues: ${issues.length}
Issues by Status: ${Object.entries(issuesByStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ")}
    `.trim();
  },
});

/**
 * Track AI usage
 */
export const trackUsage = internalMutation({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    provider: v.union(v.literal("anthropic"), v.literal("openai"), v.literal("custom")),
    model: v.string(),
    operation: v.union(
      v.literal("chat"),
      v.literal("suggestion"),
      v.literal("automation"),
      v.literal("analysis"),
    ),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find user by subject ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.insert("aiUsage", {
      userId: user._id as Id<"users">,
      projectId: args.projectId,
      provider: args.provider,
      model: args.model,
      operation: args.operation,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      totalTokens: args.totalTokens,
      responseTime: 0, // TODO: Calculate actual response time
      success: args.success,
      createdAt: Date.now(),
    });
  },
});
